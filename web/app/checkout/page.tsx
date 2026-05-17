import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const { productId } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    const next = productId ? `/checkout?productId=${encodeURIComponent(productId)}` : "/checkout";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  if (!productId) redirect("/marketplace");

  const { data: product } = await supabase
    .from("products")
    .select("id,title,price_cents,currency,active")
    .eq("id", productId)
    .maybeSingle();

  if (!product) redirect("/marketplace");

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 6 }}>Checkout</h1>
      <p style={{ color: "#6e6e78", marginBottom: 18 }}>
        Escolha o método de pagamento para <strong>{product.title}</strong>.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <form action="/api/checkout/stripe" method="post">
          <input type="hidden" name="product_id" value={productId} />
          <button
            type="submit"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: "1px solid #e8e8ed",
              background: "#111114",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Pagar com Stripe
          </button>
        </form>

        <form action="/api/checkout/coinbase" method="post">
          <input type="hidden" name="product_id" value={productId} />
          <button
            type="submit"
            style={{
              width: "100%",
              height: 48,
              borderRadius: 14,
              border: "1px solid #e8e8ed",
              background: "#fff",
              color: "#111114",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Pagar com Cripto (Coinbase)
          </button>
        </form>

        <a href="/marketplace" style={{ color: "#6e6e78" }}>
          ← voltar ao marketplace
        </a>
      </div>
    </main>
  );
}

