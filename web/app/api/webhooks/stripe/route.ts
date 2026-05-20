// web/app/api/webhooks/stripe/route.ts
//
// Webhook do Stripe — escuta checkout.session.completed e:
//   1. Cria um registro em `orders` (schema real de produção)
//   2. Cria um registro em `order_items`
//   3. Faz upsert em `entitlements` (libera o produto para o usuário)
//   4. Registra comissão de afiliado em `commissions` se aplicável
//   5. Marca o produto como `sold = true` (produto é exclusivo/único)
//
// SUPORTE A PAYMENT LINKS:
//   Quando o checkout vem de um Payment Link (em vez de Checkout Session dinâmica),
//   o user_id chega via `session.client_reference_id` (não em metadata.user_id).
//   O product_id é resolvido via `session.line_items[0].price.id` → lookup no Supabase.

import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

    // ── Resolver user_id ──────────────────────────────────────────────────
    // Prioridade:
    //   1. session.client_reference_id  → Payment Link (novo fluxo)
    //   2. metadata.user_id             → Checkout Session dinâmica (legado)
    const userId = (session.client_reference_id ?? meta.user_id ?? "").trim();

    // ── Resolver product_id ───────────────────────────────────────────────
    // Prioridade:
    //   1. metadata.product_id          → Checkout Session dinâmica (legado)
    //   2. Lookup via stripe_price_id   → Payment Link (novo fluxo)
    let productId = (meta.product_id ?? "").trim();
    let plan = (meta.plan ?? "").trim() as "basic" | "pro" | "premium";
    const affiliateCode = (meta.affiliate_code ?? "").trim();

    const admin = createSupabaseAdminClient();

    // Se não temos product_id no metadata, resolvemos via price_id do Payment Link
    if (!productId) {
      // Expandir line_items para obter o price.id
      let priceId: string | null = null;
      try {
        const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ["line_items.data.price"],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const firstItem = (sessionWithItems.line_items?.data ?? [])[0] as any;
        priceId = firstItem?.price?.id ?? null;
      } catch (e) {
        console.error("[Webhook] Failed to expand line_items:", e);
      }

      if (priceId) {
        // Buscar o produto pelo stripe_price_id (qualquer plano)
        const { data: productRow } = await admin
          .from("products")
          .select("id, stripe_price_basic_id, stripe_price_pro_id, stripe_price_premium_id, stripe_payment_link_basic_id, stripe_payment_link_pro_id, stripe_payment_link_premium_id")
          .or(
            `stripe_price_basic_id.eq.${priceId},` +
            `stripe_price_pro_id.eq.${priceId},` +
            `stripe_price_premium_id.eq.${priceId}`
          )
          .maybeSingle();

        if (productRow) {
          productId = productRow.id;
          // Determinar o plano pelo price_id
          if (priceId === productRow.stripe_price_basic_id)   plan = "basic";
          else if (priceId === productRow.stripe_price_pro_id)   plan = "pro";
          else if (priceId === productRow.stripe_price_premium_id) plan = "premium";
          else plan = "basic";
        } else {
          // Tentar lookup via payment_link_id
          const paymentLinkId = session.payment_link ?? null;
          if (paymentLinkId) {
            const { data: productByLink } = await admin
              .from("products")
              .select("id, stripe_payment_link_basic_id, stripe_payment_link_pro_id, stripe_payment_link_premium_id")
              .or(
                `stripe_payment_link_basic_id.eq.${paymentLinkId},` +
                `stripe_payment_link_pro_id.eq.${paymentLinkId},` +
                `stripe_payment_link_premium_id.eq.${paymentLinkId}`
              )
              .maybeSingle();

            if (productByLink) {
              productId = productByLink.id;
              if (paymentLinkId === productByLink.stripe_payment_link_basic_id)   plan = "basic";
              else if (paymentLinkId === productByLink.stripe_payment_link_pro_id)   plan = "pro";
              else if (paymentLinkId === productByLink.stripe_payment_link_premium_id) plan = "premium";
              else plan = "basic";
            }
          }
        }
      }
    }

    if (!plan) plan = "basic";

    if (!userId || !productId) {
      console.warn("[Webhook] Missing user_id or product_id", {
        userId, productId, meta,
        client_reference_id: session.client_reference_id,
        payment_link: session.payment_link,
      });
      return NextResponse.json({ received: true, warning: "Missing user_id or product_id" });
    }

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

    // ── 3b. Criar registro em `orders` ────────────────────────────────────
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
        payment_id:     session.id,
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
    }

    // ── 3e. Marcar produto como sold ──────────────────────────────────────
    await admin
      .from("products")
      .update({ sold: true, sold_at: new Date().toISOString(), sold_to: userId })
      .eq("id", productId);

    // ── 3f. Registrar comissão de afiliado ────────────────────────────────
    if (affiliateCode) {
      const { data: affiliateProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("affiliate_code", affiliateCode)
        .maybeSingle();

      if (affiliateProfile?.id && affiliateProfile.id !== userId) {
        const rate = 0.20;
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
      source: session.client_reference_id ? "payment_link" : "checkout_session",
    });
  }

  return NextResponse.json({ received: true });
}
