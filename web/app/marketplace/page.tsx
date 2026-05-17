import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  currency: string;
  cover_image_url: string | null;
};

function formatPrice(cents: number, currency: string) {
  const value = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${currency.toUpperCase()} ${value.toFixed(2)}`;
  }
}

export default async function MarketplacePage() {
  let products: Product[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("id,title,description,price_cents,currency,cover_image_url")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) errorMessage = error.message;
    products = (data ?? []) as Product[];
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Failed to load products";
  }

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Marketplace</h1>
          <p style={{ color: "#6e6e78" }}>Explore os produtos. Para comprar, você vai precisar entrar.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="nav__login" href="/login">
            Login
          </a>
        </div>
      </header>

      {errorMessage ? (
        <p style={{ marginTop: 16, color: "#6e6e78" }}>
          Não consegui carregar produtos ainda: <span style={{ color: "#0f0f10" }}>{errorMessage}</span>
        </p>
      ) : null}

      <section
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        {products.length ? (
          products.map((p) => (
            <article
              key={p.id}
              style={{
                border: "1px solid #e8e8ed",
                background: "#fff",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(15,15,16,0.08)",
              }}
            >
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />
              ) : (
                <div style={{ height: 180, background: "#f5f5f7" }} />
              )}
              <div style={{ padding: 14 }}>
                <h3 style={{ marginBottom: 6 }}>{p.title}</h3>
                <p style={{ color: "#6e6e78", fontSize: 14, lineHeight: 1.45, minHeight: 40 }}>
                  {p.description}
                </p>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <strong>{formatPrice(p.price_cents, p.currency)}</strong>
                  <a href={`/product/${p.id}`} style={{ fontWeight: 700 }}>
                    Ver detalhes →
                  </a>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", color: "#6e6e78" }}>
            Nenhum produto cadastrado ainda. (Quando você rodar `web/supabase/schema.sql` e inserir produtos, eles
            aparecem aqui.)
          </div>
        )}
      </section>
    </main>
  );
}

