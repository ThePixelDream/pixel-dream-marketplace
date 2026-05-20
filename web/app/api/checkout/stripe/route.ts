// web/app/api/checkout/stripe/route.ts
//
// Cria uma Stripe Checkout Session usando o stripe_price_id oficial do produto.
// O plano (basic | pro | premium) é recebido via form field "plan".
// Se o produto ainda não tiver stripe_price_id (produto legado), faz fallback
// para price_data dinâmico e dispara a sincronização em background.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  // ── 1. Autenticação ────────────────────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  // ── 2. Payload ─────────────────────────────────────────────────────────────
  const formData = await request.formData();
  const productId = String(formData.get("product_id") || "").trim();
  const plan = (String(formData.get("plan") || "basic").trim()) as "basic" | "pro" | "premium";

  if (!productId) {
    return NextResponse.redirect(new URL("/marketplace", request.url), 303);
  }

  // ── 3. Buscar produto no Supabase ──────────────────────────────────────────
  const { data: productData } = await supabase
    .from("products")
    .select(
      "id, title, price_basic, price_pro, price_premium, currency, active, sold," +
      "stripe_price_basic_id, stripe_price_pro_id, stripe_price_premium_id"
    )
    .eq("id", productId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = productData as any;

  if (!product || !product.active || product.sold) {
    return NextResponse.redirect(new URL("/marketplace", request.url), 303);
  }

  // ── 4. Verificar se o usuário já comprou este produto ──────────────────────
  const { data: existing } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", userData.user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    return NextResponse.redirect(new URL("/account", request.url), 303);
  }

  // ── 5. Buscar affiliate_code do perfil ────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("referred_by_code")
    .eq("id", userData.user.id)
    .maybeSingle();

  const stripe = getStripe();
  const url = new URL(request.url);
  const origin = `${url.protocol}//${url.host}`;

  // ── 6. Determinar price e unit_amount pelo plano ───────────────────────────
  const priceIdMap: Record<"basic" | "pro" | "premium", string | null> = {
    basic:   (product.stripe_price_basic_id as string | null) ?? null,
    pro:     (product.stripe_price_pro_id as string | null) ?? null,
    premium: (product.stripe_price_premium_id as string | null) ?? null,
  };
  const unitAmountMap: Record<"basic" | "pro" | "premium", number> = {
    basic:   product.price_basic as number,
    pro:     product.price_pro as number,
    premium: product.price_premium as number,
  };

  const stripePriceId = priceIdMap[plan];
  const unitAmount    = unitAmountMap[plan];
  const currency      = (product.currency as string) ?? "usd";

  // ── 7. Construir line_items ────────────────────────────────────────────────
  // Usa o Price oficial do Stripe quando disponível; caso contrário, fallback dinâmico
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lineItems: any[];

  if (stripePriceId) {
    lineItems = [{ price: stripePriceId, quantity: 1 }];
  } else {
    // Fallback: price_data dinâmico (produto legado sem stripe_price_id)
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    lineItems = [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: { name: `${product.title} — ${planLabel}` },
        },
      },
    ];
    // Disparar sincronização em background (fire-and-forget)
    fetch(`${origin}/api/admin/sync-stripe-product`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    }).catch(() => {/* silencioso */});
  }

  // ── 8. Criar Checkout Session no Stripe ───────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: userData.user.email ?? undefined,
    line_items: lineItems,
    success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${origin}/product/${product.id}`,
    metadata: {
      product_id:     product.id,
      user_id:        userData.user.id,
      plan,
      affiliate_code: profile?.referred_by_code ?? "",
    },
    payment_intent_data: {
      metadata: {
        product_id: product.id,
        user_id:    userData.user.id,
        plan,
      },
    },
  });

  return NextResponse.redirect(session.url!, 303);
}
