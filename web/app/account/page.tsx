// web/app/account/page.tsx
//
// Área do cliente — exibe todos os produtos comprados (via tabela entitlements)
// e disponibiliza os arquivos de entrega (LoRA, SFW, NSFW) para download.

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// ── Tipos ──────────────────────────────────────────────────────────────────────
type DeliveryFile = { label: string; url: string };

type EntitlementRow = {
  id: string;
  granted_at: string;
  plan: string;
  product: {
    id: string; title: string;
    cover_image_url: string | null;
    avatar_image_url: string | null;
    delivery_lora:    DeliveryFile[];
    delivery_sfw:     DeliveryFile[];
    delivery_nsfw:    DeliveryFile[];
  } | {
    id: string; title: string;
    cover_image_url: string | null;
    avatar_image_url: string | null;
    delivery_lora:    DeliveryFile[];
    delivery_sfw:     DeliveryFile[];
    delivery_nsfw:    DeliveryFile[];
  }[];
};

function getProduct(e: EntitlementRow) {
  return Array.isArray(e.product) ? e.product[0] : e.product;
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    basic:   { bg: "#1e293b", color: "#94a3b8" },
    pro:     { bg: "#1e1b4b", color: "#a5b4fc" },
    premium: { bg: "#4a1d1d", color: "#fca5a5" },
  };
  const style = colors[plan] ?? colors.basic;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 999,
      fontSize: 11, fontWeight: 800, textTransform: "uppercase" as const,
      letterSpacing: "0.06em", background: style.bg, color: style.color,
    }}>
      {plan}
    </span>
  );
}

function FileList({ files, label, color }: { files: DeliveryFile[]; label: string; color: string }) {
  if (!files || files.length === 0) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
        {files.map((f, i) => (
          <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" download
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 8,
              border: "1px solid #2e2e36", background: "#1a1a1f",
              color: "#f0f0f2", textDecoration: "none",
              fontSize: 13, fontWeight: 600,
            }}
          >
            <span style={{ fontSize: 16 }}>⬇</span>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {f.label || `Arquivo ${i + 1}`}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role, affiliate_code, created_at")
    .eq("id", userData.user.id)
    .maybeSingle();

  const { data: entitlements } = await supabase
    .from("entitlements")
    .select(`id, granted_at, plan,
      product:products (
        id, title, cover_image_url, avatar_image_url,
        delivery_lora, delivery_sfw, delivery_nsfw
      )`)
    .eq("user_id", userData.user.id)
    .order("granted_at", { ascending: false });

  const list = (entitlements ?? []) as unknown as EntitlementRow[];

  const C = {
    bg: "#0f0f10", surface: "#1a1a1f", surface2: "#222228",
    border: "#2e2e36", text: "#f0f0f2", muted: "#7a7a8a", pink: "#e91e8c",
  };

  return (
    <main style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      {/* Header */}
      <header style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky" as const, top: 0, zIndex: 10,
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: C.pink, letterSpacing: "-0.02em" }}>ThePixelDream</span>
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href="/marketplace" style={{
            height: 36, padding: "0 16px", borderRadius: 999,
            border: `1px solid ${C.border}`, background: "transparent",
            color: C.text, fontWeight: 600, fontSize: 13,
            display: "flex", alignItems: "center", textDecoration: "none",
          }}>Marketplace</a>
          <form action="/auth/logout" method="post">
            <button type="submit" style={{
              height: 36, padding: "0 16px", borderRadius: 999,
              border: `1px solid ${C.border}`, background: "transparent",
              color: C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}>Sair</button>
          </form>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>Minha Conta</h1>
          <p style={{ color: C.muted, marginTop: 6, fontSize: 15 }}>{profile?.email ?? userData.user.email}</p>
        </div>

        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Modelos Liberados</h2>
            <span style={{
              background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 999, padding: "2px 12px", fontSize: 12, fontWeight: 700, color: C.muted,
            }}>
              {list.length} {list.length === 1 ? "modelo" : "modelos"}
            </span>
          </div>

          {list.length === 0 ? (
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: "48px 24px", textAlign: "center" as const,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Nenhum modelo comprado ainda</div>
              <p style={{ color: C.muted, fontSize: 14, margin: "0 0 20px" }}>Visite o marketplace e adquira seu primeiro modelo de IA.</p>
              <a href="/marketplace" style={{
                display: "inline-flex", alignItems: "center",
                height: 44, padding: "0 24px", borderRadius: 999,
                background: C.pink, color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none",
              }}>Ver Marketplace →</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
              {list.map((e) => {
                const p = getProduct(e);
                if (!p) return null;
                const loraFiles  = (p.delivery_lora  ?? []) as DeliveryFile[];
                const sfwFiles   = (p.delivery_sfw   ?? []) as DeliveryFile[];
                const nsfwFiles  = (p.delivery_nsfw  ?? []) as DeliveryFile[];
                const totalFiles = loraFiles.length + sfwFiles.length + nsfwFiles.length;
                return (
                  <div key={e.id} style={{
                    background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 16, padding: "16px 20px",
                      borderBottom: totalFiles > 0 ? `1px solid ${C.border}` : "none",
                    }}>
                      {p.avatar_image_url ? (
                        <img src={p.avatar_image_url} alt={p.title} width={52} height={52}
                          style={{ borderRadius: "50%", objectFit: "cover" as const, flexShrink: 0, border: `2px solid ${C.border}` }} />
                      ) : (
                        <div style={{
                          width: 52, height: 52, borderRadius: "50%", background: C.surface2,
                          flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 20, border: `2px solid ${C.border}`,
                        }}>🤖</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                          <span style={{ fontWeight: 800, fontSize: 16 }}>{p.title}</span>
                          <PlanBadge plan={e.plan ?? "basic"} />
                        </div>
                        <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                          Liberado em {new Date(e.granted_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                        </div>
                      </div>
                      <a href={`/product/${p.id}`} style={{
                        flexShrink: 0, height: 36, padding: "0 16px", borderRadius: 999,
                        border: `1px solid ${C.border}`, background: "transparent",
                        color: C.text, fontWeight: 700, fontSize: 13, textDecoration: "none",
                        display: "flex", alignItems: "center",
                      }}>Ver produto</a>
                    </div>
                    {totalFiles > 0 ? (
                      <div style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 4 }}>
                          Arquivos disponíveis para download ({totalFiles})
                        </div>
                        <FileList files={loraFiles}  label="Modelo LoRA (.safetensors)" color="#a78bfa" />
                        <FileList files={sfwFiles}   label="Imagens SFW (Safe)"         color="#34d399" />
                        <FileList files={nsfwFiles}  label="Imagens NSFW (Adult)"       color="#f87171" />
                      </div>
                    ) : (
                      <div style={{ padding: "14px 20px", color: C.muted, fontSize: 13 }}>
                        Os arquivos de entrega serão disponibilizados em breve pelo administrador.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {profile?.affiliate_code && (
          <section style={{ marginTop: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px" }}>Seu Código de Afiliado</h2>
            <div style={{
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "16px 20px",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
            }}>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 900, color: C.pink, letterSpacing: "0.08em" }}>
                  {profile.affiliate_code}
                </div>
                <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                  Compartilhe este código e ganhe 20% de comissão por cada venda indicada.
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

