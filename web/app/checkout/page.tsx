// web/app/checkout/page.tsx
//
// Página intermediária de checkout.
// Recebe os query params: ?plan=basic|pro|premium&product=<uuid>
// (a página de produto envia `product`, não `productId`)
//
// BUGS CORRIGIDOS:
//   1. Query param: a página de produto envia ?product=, mas esta página lia ?productId=
//      → resultado: productId ficava undefined → redirect("/marketplace")
//   2. Coluna inexistente: a query selecionava "price_cents" que não existe no schema
//      → resultado: Supabase retornava erro → product ficava null → redirect("/marketplace")

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; productId?: string; plan?: string }>;
}) {
  const params = await searchParams;

  // Bug 1 fix: aceita tanto ?product= (novo padrão da página de produto)
  //            quanto ?productId= (legado, para não quebrar links antigos)
  const productId = (params.product ?? params.productId ?? "").trim();
  const plan      = (params.plan ?? "basic").trim();

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    const next = productId
      ? `/checkout?product=${encodeURIComponent(productId)}&plan=${encodeURIComponent(plan)}`
      : "/checkout";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!productId) redirect("/marketplace");

  // Bug 2 fix: removida a coluna "price_cents" que não existe no schema real.
  // Os preços ficam em price_basic / price_pro / price_premium (em centavos).
  const { data: productData } = await supabase
    .from("products")
    .select("id, title, price_basic, price_pro, price_premium, currency, active, sold")
    .eq("id", productId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = productData as any;

  if (!product || !product.active || product.sold) redirect("/marketplace");

  // Preço a exibir conforme o plano selecionado
  const priceMap: Record<string, number> = {
    basic:   product.price_basic   ?? 0,
    pro:     product.price_pro     ?? 0,
    premium: product.price_premium ?? 0,
  };
  const planLabel    = plan.charAt(0).toUpperCase() + plan.slice(1);
  const priceCents   = priceMap[plan] ?? priceMap.basic;
  const currency     = (product.currency ?? "usd").toUpperCase();
  const priceDisplay = `${currency} ${(priceCents / 100).toFixed(2)}`;

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Checkout</h1>
      <p style={{ color: "#6e6e78", marginBottom: 4 }}>
        Produto: <strong>{product.title}</strong>
      </p>
      <p style={{ color: "#6e6e78", marginBottom: 18 }}>
        Plano: <strong>{planLabel}</strong> — <strong>{priceDisplay}</strong>
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {/* Stripe */}
        <form action="/api/checkout/stripe" method="post">
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="plan"       value={plan} />
          <button
            type="submit"
            style={{
              width: "100%", height: 48, borderRadius: 14,
              border: "1px solid #e8e8ed", background: "#111114",
              color: "#fff", fontWeight: 900, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Pagar com Stripe
          </button>
        </form>

        {/* Coinbase */}
        <form action="/api/checkout/coinbase" method="post">
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="plan"       value={plan} />
          <button
            type="submit"
            style={{
              width: "100%", height: 48, borderRadius: 14,
              border: "1px solid #e8e8ed", background: "#fff",
              color: "#111114", fontWeight: 900, cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Pagar com Cripto (Coinbase)
          </button>
        </form>

        <a href={`/product/${productId}`} style={{ color: "#6e6e78", textDecoration: "none" }}>
          ← voltar ao produto
        </a>
      </div>
    </main>
  );
}
