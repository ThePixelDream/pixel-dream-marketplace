import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });

  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const meta = (session.metadata ?? {}) as Record<string, string>;
    const userId = meta.user_id;
    const productId = meta.product_id;
    const affiliateCode = (meta.affiliate_code ?? "").trim();

    if (userId && productId) {
      const admin = createSupabaseAdminClient();

      // Create order
      const { data: order, error: orderErr } = await admin
        .from("orders")
        .insert({
          user_id: userId,
          provider: "stripe",
          provider_ref: session.id,
          status: "paid",
          currency: session.currency ?? "usd",
          total_cents: session.amount_total ?? 0,
        })
        .select("id")
        .single();

      if (!orderErr && order?.id) {
        await admin.from("order_items").insert({
          order_id: order.id,
          product_id: productId,
          qty: 1,
          unit_price_cents: session.amount_total ?? 0,
        });

        await admin.from("entitlements").upsert({
          user_id: userId,
          product_id: productId,
          order_id: order.id,
        });

        if (affiliateCode) {
          const { data: affiliate } = await admin
            .from("affiliates")
            .select("user_id,status")
            .eq("code", affiliateCode)
            .maybeSingle();

          if (affiliate?.user_id && affiliate.status === "active" && affiliate.user_id !== userId) {
            // MVP: fixed 10% commission
            const amount = Math.max(0, Math.round((session.amount_total ?? 0) * 0.1));
            await admin.from("affiliate_commissions").insert({
              order_id: order.id,
              affiliate_user_id: affiliate.user_id,
              amount_cents: amount,
              status: "pending",
            });
          }
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

