// web/app/api/webhooks/stripe/route.ts
//
// Webhook do Stripe — escuta checkout.session.completed e:
//   1. Cria um registro em `orders` (schema real de produção)
//   2. Cria um registro em `order_items`
//   3. Faz upsert em `entitlements` (libera o produto para o usuário)
//   4. Registra comissão de afiliado em `commissions` se aplicável
//   5. Marca o produto como `sold = true` (produto é exclusivo/único)

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Necessário para que o Next.js não faça parse do body antes do Stripe verificar a assinatura
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // ── 1. Verificar segredo do webhook ───────────────────────────────────────
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  // ── 2. Construir e verificar o evento ─────────────────────────────────────
  const body = await request.text();
  let event: ReturnType<typeof stripe.webhooks.constructEvent>;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid signature" },
      { status: 400 }
    );
  }

  // ── 3. Processar apenas checkout.session.completed ────────────────────────
  if (event.type === "checkout.session.completed") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = event.data.object as any;
    const meta = (session.metadata ?? {}) as Record<string, string>;

    const userId        = meta.user_id?.trim();
    const productId     = meta.product_id?.trim();
    const plan          = (meta.plan ?? "basic").trim() as "basic" | "pro" | "premium";
    const affiliateCode = (meta.affiliate_code ?? "").trim();

    if (!userId || !productId) {
      console.warn("[Webhook] Missing user_id or product_id in metadata", meta);
      return NextResponse.json({ received: true, warning: "Missing metadata" });
    }

    const admin = createSupabaseAdminClient();

    // ── 3a. Idempotência: verificar se já processamos esta sessão ──────────
    const { data: existingOrder } = await admin
      .from("orders")
      .select("id")
      .eq("payment_id", session.id)
      .maybeSingle();

    if (existingOrder) {
      console.log("[Webhook] Already processed session:", session.id);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // ── 3b. Criar registro em `orders` (schema real de produção) ──────────
    // Colunas reais: id, product_id, user_id, plan, amount_cents, currency,
    //               status, payment_method, payment_id, affiliate_code, created_at, paid_at
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        product_id:     productId,
        user_id:        userId,
        plan,
        amount_cents:   session.amount_total ?? 0,
        currency:       session.currency ?? "usd",
        status:         "paid",
        payment_method: "stripe",
        payment_id:     session.id,           // stripe checkout session id (idempotência)
        affiliate_code: affiliateCode || null,
        paid_at:        new Date().toISOString(),
      })
      .select("id")
      .single();

    if (orderErr || !order?.id) {
      console.error("[Webhook] Failed to create order:", orderErr);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    // ── 3c. Criar registro em `order_items` ───────────────────────────────
    await admin.from("order_items").insert({
      order_id:         order.id,
      product_id:       productId,
      plan,
      qty:              1,
      unit_price_cents: session.amount_total ?? 0,
    });

    // ── 3d. Upsert em `entitlements` — libera o produto para o usuário ────
    const { error: entErr } = await admin.from("entitlements").upsert(
      {
        user_id:    userId,
        product_id: productId,
        order_id:   order.id,
        plan,
      },
      { onConflict: "user_id,product_id" }
    );

    if (entErr) {
      console.error("[Webhook] Failed to create entitlement:", entErr);
      // Não retorna erro — o order já foi criado; entitlement pode ser reprocessado
    }

    // ── 3e. Marcar produto como sold (produtos são exclusivos/únicos) ──────
    await admin
      .from("products")
      .update({ sold: true, sold_at: new Date().toISOString(), sold_to: userId })
      .eq("id", productId);

    // ── 3f. Registrar comissão de afiliado ────────────────────────────────
    // Tabela real: commissions(id, affiliate_id, order_id, amount_cents, rate, status, created_at, paid_at)
    if (affiliateCode) {
      const { data: affiliateProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("affiliate_code", affiliateCode)
        .maybeSingle();

      if (
        affiliateProfile?.id &&
        affiliateProfile.id !== userId // não comissionar a si mesmo
      ) {
        const rate = 0.20; // 20% de comissão
        const amount = Math.max(0, Math.round((session.amount_total ?? 0) * rate));
        await admin.from("commissions").insert({
          affiliate_id: affiliateProfile.id,
          order_id:     order.id,
          amount_cents: amount,
          rate,
          status:       "pending",
        });
      }
    }

    console.log("[Webhook] checkout.session.completed processed:", {
      session_id: session.id,
      order_id:   order.id,
      user_id:    userId,
      product_id: productId,
      plan,
    });
  }

  return NextResponse.json({ received: true });
}
