// web/app/api/admin/sync-stripe-product/route.ts
//
// Rota privada (apenas admins) que:
//   1. Recebe um product_id do Supabase
//   2. Cria (ou atualiza) o Product + 3 Prices no Stripe
//   3. Salva os IDs do Stripe de volta no Supabase
//
// Chamada pelo AdminClient logo após o INSERT/UPDATE de um produto.

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  // ── 1. Autenticação e autorização ──────────────────────────────────────────
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 2. Leitura do payload ──────────────────────────────────────────────────
  const body = await request.json();
  const { product_id } = body as { product_id: string };

  if (!product_id) {
    return NextResponse.json({ error: "product_id is required" }, { status: 400 });
  }

  // ── 3. Buscar produto no Supabase ──────────────────────────────────────────
  const admin = createSupabaseAdminClient();
  const { data: product, error: fetchErr } = await admin
    .from("products")
    .select(
      "id, title, description, price_basic, price_pro, price_premium, currency, stripe_product_id"
    )
    .eq("id", product_id)
    .maybeSingle();

  if (fetchErr || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const stripe = getStripe();

  // ── 4. Criar ou recuperar o Product no Stripe ──────────────────────────────
  let stripeProductId = product.stripe_product_id as string | null;

  if (!stripeProductId) {
    // Produto novo — criar no Stripe
    const stripeProduct = await stripe.products.create({
      name: product.title,
      description: product.description ?? undefined,
      metadata: { supabase_product_id: product.id },
    });
    stripeProductId = stripeProduct.id;
  } else {
    // Produto existente — atualizar nome/descrição no Stripe
    await stripe.products.update(stripeProductId, {
      name: product.title,
      description: product.description ?? undefined,
    });
  }

  // ── 5. Criar os 3 Prices no Stripe ────────────────────────────────────────
  // Sempre criamos novos prices (Stripe não permite editar unit_amount de um price existente)
  const currency = (product.currency as string) ?? "usd";

  const [priceBasic, pricePro, pricePremium] = await Promise.all([
    stripe.prices.create({
      product: stripeProductId,
      unit_amount: product.price_basic as number,
      currency,
      metadata: { plan: "basic", supabase_product_id: product.id },
    }),
    stripe.prices.create({
      product: stripeProductId,
      unit_amount: product.price_pro as number,
      currency,
      metadata: { plan: "pro", supabase_product_id: product.id },
    }),
    stripe.prices.create({
      product: stripeProductId,
      unit_amount: product.price_premium as number,
      currency,
      metadata: { plan: "premium", supabase_product_id: product.id },
    }),
  ]);

  // ── 6. Salvar IDs do Stripe de volta no Supabase ──────────────────────────
  const { error: updateErr } = await admin
    .from("products")
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_basic_id: priceBasic.id,
      stripe_price_pro_id: pricePro.id,
      stripe_price_premium_id: pricePremium.id,
    })
    .eq("id", product_id);

  if (updateErr) {
    return NextResponse.json(
      { error: "Failed to save Stripe IDs to Supabase", detail: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    stripe_product_id: stripeProductId,
    stripe_price_basic_id: priceBasic.id,
    stripe_price_pro_id: pricePro.id,
    stripe_price_premium_id: pricePremium.id,
  });
}
