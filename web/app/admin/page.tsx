import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  active: boolean;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") redirect("/marketplace");

  const { data: products } = await supabase
    .from("products")
    .select("id,title,price_cents,currency,active")
    .order("created_at", { ascending: false });

  const list = (products ?? []) as Product[];

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Admin</h1>
          <p style={{ color: "#6e6e78" }}>Cadastrar e editar produtos (MVP).</p>
        </div>
        <form action="/auth/logout" method="post">
          <button
            type="submit"
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 999,
              border: "1px solid #e8e8ed",
              background: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Sair
          </button>
        </form>
      </header>

      <section style={{ marginTop: 18, border: "1px solid #e8e8ed", borderRadius: 16, background: "#fff" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #e8e8ed" }}>
          <h2 style={{ fontSize: 16 }}>Novo produto</h2>
        </div>
        <form action="/admin/products" method="post" style={{ padding: 14, display: "grid", gap: 12 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Título</span>
            <input
              name="title"
              required
              style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed" }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Descrição</span>
            <textarea
              name="description"
              rows={4}
              style={{ padding: 12, borderRadius: 10, border: "1px solid #e8e8ed", resize: "vertical" }}
            />
          </label>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Preço (em centavos)</span>
              <input
                name="price_cents"
                type="number"
                min={0}
                required
                defaultValue={0}
                style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed" }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontWeight: 600 }}>Moeda</span>
              <input
                name="currency"
                defaultValue="usd"
                style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed" }}
              />
            </label>
          </div>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontWeight: 600 }}>Cover image URL (opcional)</span>
            <input
              name="cover_image_url"
              placeholder="https://..."
              style={{ height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed" }}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input name="active" type="checkbox" defaultChecked />
            <span style={{ fontWeight: 600 }}>Ativo</span>
          </label>
          <button
            type="submit"
            style={{
              height: 44,
              borderRadius: 999,
              border: "none",
              background: "#111114",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Criar produto
          </button>
        </form>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 16, marginBottom: 10 }}>Produtos</h2>
        <div style={{ display: "grid", gap: 10 }}>
          {list.length ? (
            list.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid #e8e8ed",
                  borderRadius: 14,
                  background: "#fff",
                  padding: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title}
                  </div>
                  <div style={{ color: "#6e6e78", fontSize: 13 }}>
                    {p.currency.toUpperCase()} {(p.price_cents / 100).toFixed(2)} · {p.active ? "active" : "inactive"}
                  </div>
                </div>
                <a href={`/product/${p.id}`} style={{ fontWeight: 800 }}>
                  Abrir →
                </a>
              </div>
            ))
          ) : (
            <div style={{ color: "#6e6e78" }}>Nenhum produto ainda.</div>
          )}
        </div>
      </section>
    </main>
  );
}

