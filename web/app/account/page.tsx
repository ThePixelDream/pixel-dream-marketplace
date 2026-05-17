import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Entitlement = {
  id: string;
  granted_at: string;
  product: { id: string; title: string } | { id: string; title: string }[];
};

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: entitlements } = await supabase
    .from("entitlements")
    .select("id,granted_at,product:products(id,title)")
    .eq("user_id", userData.user.id)
    .order("granted_at", { ascending: false });

  const list = (entitlements ?? []) as unknown as Entitlement[];

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Minha conta</h1>
          <p style={{ color: "#6e6e78" }}>Seus produtos liberados aparecem aqui.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a className="nav__login" href="/marketplace">
            Marketplace
          </a>
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
        </div>
      </header>

      <section style={{ marginTop: 18, display: "grid", gap: 10 }}>
        {list.length ? (
          list.map((e) => (
            <div
              key={e.id}
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
                <div style={{ fontWeight: 800 }}>
                  {Array.isArray(e.product) ? e.product[0]?.title ?? "Product" : e.product.title}
                </div>
                <div style={{ color: "#6e6e78", fontSize: 13 }}>
                  Liberado em {new Date(e.granted_at).toLocaleString()}
                </div>
              </div>
              <a
                href={`/product/${Array.isArray(e.product) ? e.product[0]?.id ?? "" : e.product.id}`}
                style={{ fontWeight: 800 }}
              >
                Abrir →
              </a>
            </div>
          ))
        ) : (
          <div style={{ color: "#6e6e78" }}>Você ainda não comprou nenhum produto.</div>
        )}
      </section>
    </main>
  );
}

