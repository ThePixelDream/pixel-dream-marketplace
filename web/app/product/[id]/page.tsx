import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: product } = await supabase
    .from("products")
    .select("id,title,description,price_cents,currency,cover_image_url,active")
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    redirect("/marketplace");
  }

  const p = product as Product & { active?: boolean };

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <a href="/marketplace" style={{ fontWeight: 800 }}>
          ← Voltar
        </a>
        <a className="nav__login" href="/account">
          Minha conta
        </a>
      </header>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
        {p.cover_image_url ? (
          <img
            src={p.cover_image_url}
            alt=""
            style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 18 }}
          />
        ) : null}

        <h1 style={{ marginTop: 8 }}>{p.title}</h1>
        <p style={{ color: "#6e6e78", lineHeight: 1.6 }}>{p.description}</p>

        <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
          <strong style={{ fontSize: 18 }}>{formatPrice(p.price_cents, p.currency)}</strong>
          <a
            href={`/checkout?productId=${encodeURIComponent(p.id)}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 44,
              padding: "0 18px",
              borderRadius: 999,
              background: "#111114",
              color: "#fff",
              fontWeight: 800,
            }}
          >
            Comprar
          </a>
        </div>
      </div>
    </main>
  );
}

