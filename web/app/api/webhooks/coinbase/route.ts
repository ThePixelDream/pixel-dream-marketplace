import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function verifyCoinbaseSignature(rawBody: string, signature: string, secret: string) {
  const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature));
}

export async function POST(request: Request) {
  const secret = process.env.COINBASE_COMMERCE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Missing COINBASE_COMMERCE_WEBHOOK_SECRET" }, { status: 500 });

  const sig = request.headers.get("x-cc-webhook-signature");
  if (!sig) return NextResponse.json({ error: "Missing x-cc-webhook-signature" }, { status: 400 });

  const rawBody = await request.text();
  if (!verifyCoinbaseSignature(rawBody, sig, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const payload = JSON.parse(rawBody) as any;
  const eventType = payload?.event?.type;
  const charge = payload?.event?.data;

  // We consider CONFIRMED as paid (you can choose COMPLETED depending on your risk tolerance).
  if (eventType === "charge:confirmed" || eventType === "charge:resolved" || eventType === "charge:completed") {
    const meta = (charge?.metadata ?? {}) as Record<string, string>;
    const userId = meta.user_id;
    const productId = meta.product_id;
    const affiliateCode = (meta.affiliate_code ?? "").trim();

    if (userId && productId) {
      const admin = createSupabaseAdminClient();

      const local = charge?.pricing?.local ?? {};
      const totalCents = local?.amount ? Math.round(Number(local.amount) * 100) : 0;
      const currency = (local?.currency ?? "USD").toLowerCase();

      const { data: order, error: orderErr } = await admin
        .from("orders")
        .insert({
          user_id: userId,
          provider: "coinbase",
          provider_ref: charge?.id ?? charge?.code ?? "coinbase",
          status: "paid",
          currency,
          total_cents: totalCents,
        })
        .select("id")
        .single();

      if (!orderErr && order?.id) {
        await admin.from("order_items").insert({
          order_id: order.id,
          product_id: productId,
          qty: 1,
          unit_price_cents: totalCents,
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
            const amount = Math.max(0, Math.round(totalCents * 0.1));
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

