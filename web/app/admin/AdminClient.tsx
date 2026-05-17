"use client";

// web/app/admin/AdminClient.tsx

import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function supabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  cover_image_url: string;
  avatar_image_url: string;
  gallery_urls: string[];
  video_url: string;
  price_basic: number;
  price_pro: number;
  price_premium: number;
  currency: string;
  active: boolean;
  sold: boolean;
  created_at: string;
};

type Order = {
  id: string;
  plan: string;
  amount_cents: number;
  currency: string;
  status: string;
  payment_method: string;
  affiliate_code: string;
  created_at: string;
  products: { title: string };
};

type Commission = {
  id: string;
  amount_cents: number;
  rate: number;
  status: string;
  created_at: string;
  profiles: { email: string };
};

type HeroVideo = { url: string; poster: string };

const s = {
  page: { minHeight: "100vh", background: "#f5f5f7", fontFamily: "Inter, sans-serif" } as const,
  nav: { background: "#fff", borderBottom: "1px solid #e8e8ed", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 } as const,
  navTitle: { fontWeight: 800, fontSize: 16, color: "#111" } as const,
  tabs: { display: "flex", gap: 4, padding: "16px 24px 0", maxWidth: 1100, margin: "0 auto" } as const,
  tab: (active: boolean) => ({ padding: "10px 20px", borderRadius: "10px 10px 0 0", border: "none", background: active ? "#fff" : "transparent", color: active ? "#111" : "#6e6e78", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }) as const,
  content: { maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" } as const,
  card: { background: "#fff", border: "1px solid #e8e8ed", borderRadius: "0 16px 16px 16px", padding: 24, marginBottom: 16 } as const,
  sectionTitle: { fontSize: 18, fontWeight: 800, marginBottom: 16, color: "#111" } as const,
  label: { display: "grid", gap: 6, marginBottom: 12 } as const,
  labelText: { fontWeight: 600, fontSize: 14, color: "#333" } as const,
  input: { height: 44, padding: "0 12px", borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 14, width: "100%", fontFamily: "inherit" } as const,
  textarea: { padding: 12, borderRadius: 10, border: "1px solid #e8e8ed", fontSize: 14, width: "100%", fontFamily: "inherit", resize: "vertical" as const },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 } as const,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 } as const,
  btn: { height: 44, borderRadius: 999, border: "none", background: "#111", color: "#fff", fontWeight: 800, cursor: "pointer", padding: "0 24px", fontSize: 14, fontFamily: "inherit" } as const,
  btnPink: { height: 44, borderRadius: 999, border: "none", background: "#e91e8c", color: "#fff", fontWeight: 800, cursor: "pointer", padding: "0 24px", fontSize: 14, fontFamily: "inherit" } as const,
  btnOutline: { height: 36, borderRadius: 8, border: "1px solid #e8e8ed", background: "#fff", fontWeight: 600, cursor: "pointer", padding: "0 14px", fontSize: 13, fontFamily: "inherit" } as const,
  uploadArea: { border: "2px dashed #e8e8ed", borderRadius: 12, padding: 20, textAlign: "center" as const, cursor: "pointer", color: "#6e6e78", fontSize: 14 } as const,
  previewRow: { display: "flex", gap: 10, flexWrap: "wrap" as const, marginTop: 10 } as const,
  preview: { width: 80, height: 80, borderRadius: 8, objectFit: "cover" as const, border: "1px solid #e8e8ed" } as const,
  tag: { display: "inline-flex", alignItems: "center", gap: 4, background: "#f0f0f5", borderRadius: 6, padding: "3px 8px", fontSize: 12, fontWeight: 500, color: "#333" } as const,
  tagsRow: { display: "flex", gap: 6, flexWrap: "wrap" as const, marginTop: 6 } as const,
  badge: (color: string) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700, background: color === "green" ? "#dcfce7" : color === "red" ? "#fee2e2" : "#f3f4f6", color: color === "green" ? "#16a34a" : color === "red" ? "#dc2626" : "#555" }) as const,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 } as const,
  th: { textAlign: "left" as const, padding: "8px 12px", fontWeight: 700, borderBottom: "1px solid #e8e8ed", color: "#6e6e78", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em" } as const,
  td: { padding: "10px 12px", borderBottom: "1px solid #f5f5f7", verticalAlign: "middle" as const } as const,
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function uploadFile(file: File, path: string): Promise<string> {
  const sb = supabase();
  const { error } = await sb.storage.from("products").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = sb.storage.from("products").getPublicUrl(path);
  return data.publicUrl;
}

export default function AdminClient({
  products: initialProducts,
  orders,
  commissions,
  heroVideos: initialHeroVideos,
}: {
  products: Product[];
  orders: Order[];
  commissions: Commission[];
  heroVideos: HeroVideo[];
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [tab, setTab] = useState<"products" | "new" | "orders" | "affiliates" | "hero">("products");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // New product form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [priceBasic, setPriceBasic] = useState(54900);
  const [pricePro, setPricePro] = useState(64900);
  const [pricePremium, setPricePremium] = useState(79900);

  // Hero videos
  const [heroVideos, setHeroVideos] = useState<HeroVideo[]>(initialHeroVideos);

  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // Revenue stats
  const totalRevenue = orders.filter(o => o.status === "paid").reduce((sum, o) => sum + o.amount_cents, 0);
  const totalOrders = orders.filter(o => o.status === "paid").length;
  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount_cents, 0);

  async function handleCreateProduct() {
    if (!title.trim()) { setMsg("Título obrigatório"); return; }
    setLoading(true);
    setMsg("");
    try {
      const slug = slugify(title);
      const tags = tagsInput.split(",").map(t => t.trim().replace(/^#/, "")).filter(Boolean);

      let cover_image_url = "";
      let avatar_image_url = "";
      let video_url = "";
      const gallery_urls: string[] = [];

      if (coverFile) cover_image_url = await uploadFile(coverFile, `${slug}/cover-${Date.now()}`);
      if (avatarFile) avatar_image_url = await uploadFile(avatarFile, `${slug}/avatar-${Date.now()}`);
      if (videoFile) video_url = await uploadFile(videoFile, `${slug}/video-${Date.now()}`);
      for (let i = 0; i < galleryFiles.length && i < 4; i++) {
        const url = await uploadFile(galleryFiles[i], `${slug}/gallery-${i}-${Date.now()}`);
        gallery_urls.push(url);
      }

      const { data, error } = await supabase().from("products").insert({
        title: title.trim(),
        slug,
        description: description.trim(),
        tags,
        cover_image_url,
        avatar_image_url,
        gallery_urls,
        video_url,
        price_basic: priceBasic,
        price_pro: pricePro,
        price_premium: pricePremium,
        currency: "usd",
        active: true,
        sold: false,
      }).select().single();

      if (error) throw error;
      setProducts(prev => [data, ...prev]);
      setTitle(""); setDescription(""); setTagsInput("");
      setCoverFile(null); setAvatarFile(null); setGalleryFiles([]); setVideoFile(null);
      setMsg("✅ Produto criado com sucesso!");
      setTab("products");
    } catch (e: unknown) {
      setMsg("❌ Erro: " + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  }

  async function toggleActive(product: Product) {
    await supabase().from("products").update({ active: !product.active }).eq("id", product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !p.active } : p));
  }

  async function deleteProduct(id: string) {
    if (!confirm("Apagar produto?")) return;
    await supabase().from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function saveHeroVideos() {
    setLoading(true);
    await supabase().from("site_settings").upsert({ key: "hero_videos", value: { videos: heroVideos } });
    setLoading(false);
    setMsg("✅ Hero videos salvos!");
  }

  async function uploadHeroVideo(index: number, file: File) {
    const url = await uploadFile(file, `hero/video-${index}-${Date.now()}`);
    setHeroVideos(prev => prev.map((v, i) => i === index ? { ...v, url } : v));
  }

  return (
    <div style={s.page}>
      {/* Navbar */}
      <nav style={s.nav}>
        <span style={s.navTitle}>The Pixel Dream · Admin</span>
        <form action="/auth/logout" method="post">
          <button type="submit" style={s.btnOutline}>Sair</button>
        </form>
      </nav>

      {/* Stats bar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e8e8ed", padding: "12px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 32 }}>
          {[
            { label: "Receita total", value: `$${(totalRevenue / 100).toFixed(0)}` },
            { label: "Vendas pagas", value: totalOrders },
            { label: "Produtos ativos", value: products.filter(p => p.active && !p.sold).length },
            { label: "Comissões geradas", value: `$${(totalCommissions / 100).toFixed(0)}` },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: 11, color: "#6e6e78", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#111" }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {(["products", "new", "orders", "affiliates", "hero"] as const).map(t => (
          <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
            {{ products: "Produtos", new: "+ Novo produto", orders: "Vendas", affiliates: "Afiliados", hero: "Hero videos" }[t]}
          </button>
        ))}
      </div>

      <div style={s.content}>
        {msg && <div style={{ padding: "12px 16px", borderRadius: 10, background: msg.startsWith("✅") ? "#dcfce7" : "#fee2e2", marginBottom: 16, fontWeight: 600, fontSize: 14 }}>{msg}</div>}

        {/* ── PRODUCTS LIST ── */}
        {tab === "products" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Produtos ({products.length})</div>
            {products.length === 0 && <p style={{ color: "#6e6e78" }}>Nenhum produto ainda. Crie um!</p>}
            <div style={{ display: "grid", gap: 12 }}>
              {products.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: 12, border: "1px solid #e8e8ed", borderRadius: 12 }}>
                  {p.cover_image_url && <img src={p.cover_image_url} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />}
                  {!p.cover_image_url && <div style={{ width: 56, height: 56, borderRadius: 8, background: "#f0f0f5" }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: "#6e6e78", marginTop: 2 }}>
                      Basic ${(p.price_basic / 100)} · Pro ${(p.price_pro / 100)} · Premium ${(p.price_premium / 100)}
                    </div>
                    <div style={s.tagsRow}>
                      {(p.tags ?? []).map(t => <span key={t} style={s.tag}>#{t}</span>)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    {p.sold && <span style={s.badge("red")}>VENDIDO</span>}
                    {!p.sold && <span style={s.badge(p.active ? "green" : "grey")}>{p.active ? "ATIVO" : "INATIVO"}</span>}
                    <button style={s.btnOutline} onClick={() => toggleActive(p)}>{p.active ? "Desativar" : "Ativar"}</button>
                    <a href={`/product/${p.id}`} style={{ ...s.btnOutline, display: "inline-flex", alignItems: "center" }}>Ver →</a>
                    <button style={{ ...s.btnOutline, color: "#dc2626", borderColor: "#fca5a5" }} onClick={() => deleteProduct(p.id)}>Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── NEW PRODUCT ── */}
        {tab === "new" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Novo produto</div>
            <div style={s.grid2}>
              <label style={s.label}>
                <span style={s.labelText}>Título *</span>
                <input style={s.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="LATINA002" />
              </label>
              <label style={s.label}>
                <span style={s.labelText}>Tags (separadas por vírgula)</span>
                <input style={s.input} value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="latina, teen, girlnextdoor" />
              </label>
            </div>

            <label style={s.label}>
              <span style={s.labelText}>Descrição</span>
              <textarea style={s.textarea} rows={3} value={description} onChange={e => setDescription(e.target.value)} />
            </label>

            <div style={s.grid3}>
              <label style={s.label}>
                <span style={s.labelText}>Preço Basic (centavos)</span>
                <input style={s.input} type="number" value={priceBasic} onChange={e => setPriceBasic(Number(e.target.value))} />
                <span style={{ fontSize: 11, color: "#6e6e78" }}>${(priceBasic / 100).toFixed(2)}</span>
              </label>
              <label style={s.label}>
                <span style={s.labelText}>Preço Pro (centavos)</span>
                <input style={s.input} type="number" value={pricePro} onChange={e => setPricePro(Number(e.target.value))} />
                <span style={{ fontSize: 11, color: "#6e6e78" }}>${(pricePro / 100).toFixed(2)}</span>
              </label>
              <label style={s.label}>
                <span style={s.labelText}>Preço Premium (centavos)</span>
                <input style={s.input} type="number" value={pricePremium} onChange={e => setPricePremium(Number(e.target.value))} />
                <span style={{ fontSize: 11, color: "#6e6e78" }}>${(pricePremium / 100).toFixed(2)}</span>
              </label>
            </div>

            <div style={s.grid2}>
              {/* Cover image */}
              <label style={s.label}>
                <span style={s.labelText}>Foto cover (banner)</span>
                <div style={s.uploadArea} onClick={() => coverRef.current?.click()}>
                  {coverFile ? coverFile.name : "Clique para selecionar"}
                </div>
                <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setCoverFile(e.target.files?.[0] ?? null)} />
                {coverFile && <img src={URL.createObjectURL(coverFile)} style={{ ...s.preview, width: "100%", height: 120, marginTop: 8 }} />}
              </label>

              {/* Avatar */}
              <label style={s.label}>
                <span style={s.labelText}>Foto avatar (círculo)</span>
                <div style={s.uploadArea} onClick={() => avatarRef.current?.click()}>
                  {avatarFile ? avatarFile.name : "Clique para selecionar"}
                </div>
                <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => setAvatarFile(e.target.files?.[0] ?? null)} />
                {avatarFile && <img src={URL.createObjectURL(avatarFile)} style={{ ...s.preview, borderRadius: "50%", marginTop: 8 }} />}
              </label>
            </div>

            {/* Gallery */}
            <label style={s.label}>
              <span style={s.labelText}>Galeria (até 4 fotos)</span>
              <div style={s.uploadArea} onClick={() => galleryRef.current?.click()}>
                {galleryFiles.length ? `${galleryFiles.length} foto(s) selecionada(s)` : "Clique para selecionar até 4 fotos"}
              </div>
              <input ref={galleryRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                onChange={e => setGalleryFiles(Array.from(e.target.files ?? []).slice(0, 4))} />
              <div style={s.previewRow}>
                {galleryFiles.map((f, i) => <img key={i} src={URL.createObjectURL(f)} style={s.preview} />)}
              </div>
            </label>

            {/* Video */}
            <label style={s.label}>
              <span style={s.labelText}>Vídeo (mp4)</span>
              <div style={s.uploadArea} onClick={() => videoRef.current?.click()}>
                {videoFile ? videoFile.name : "Clique para selecionar o vídeo"}
              </div>
              <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => setVideoFile(e.target.files?.[0] ?? null)} />
            </label>

            <button style={s.btnPink} onClick={handleCreateProduct} disabled={loading}>
              {loading ? "Salvando..." : "Criar produto"}
            </button>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Vendas</div>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Produto", "Plano", "Valor", "Status", "Método", "Afiliado", "Data"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={s.td}>{o.products?.title ?? "-"}</td>
                    <td style={s.td}>{o.plan?.toUpperCase()}</td>
                    <td style={s.td}>${(o.amount_cents / 100).toFixed(2)}</td>
                    <td style={s.td}><span style={s.badge(o.status === "paid" ? "green" : "red")}>{o.status}</span></td>
                    <td style={s.td}>{o.payment_method ?? "-"}</td>
                    <td style={s.td}>{o.affiliate_code ?? "-"}</td>
                    <td style={s.td}>{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {orders.length === 0 && <tr><td colSpan={7} style={{ ...s.td, color: "#6e6e78" }}>Nenhuma venda ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── AFFILIATES ── */}
        {tab === "affiliates" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Comissões de afiliados</div>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Afiliado", "Comissão", "Taxa", "Status", "Data"].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id}>
                    <td style={s.td}>{c.profiles?.email ?? "-"}</td>
                    <td style={s.td}>${(c.amount_cents / 100).toFixed(2)}</td>
                    <td style={s.td}>{(Number(c.rate) * 100).toFixed(0)}%</td>
                    <td style={s.td}><span style={s.badge(c.status === "paid" ? "green" : "grey")}>{c.status}</span></td>
                    <td style={s.td}>{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
                {commissions.length === 0 && <tr><td colSpan={5} style={{ ...s.td, color: "#6e6e78" }}>Nenhuma comissão ainda.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* ── HERO VIDEOS ── */}
        {tab === "hero" && (
          <div style={s.card}>
            <div style={s.sectionTitle}>Hero videos da página inicial</div>
            <p style={{ color: "#6e6e78", fontSize: 14, marginBottom: 20 }}>
              Configure os 4 vídeos que aparecem no carousel da landing page.
            </p>
            {heroVideos.map((v, i) => (
              <div key={i} style={{ marginBottom: 20, padding: 16, border: "1px solid #e8e8ed", borderRadius: 12 }}>
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Vídeo {i + 1}</div>
                <label style={s.label}>
                  <span style={s.labelText}>URL do vídeo (mp4)</span>
                  <input style={s.input} value={v.url} onChange={e => setHeroVideos(prev => prev.map((hv, hi) => hi === i ? { ...hv, url: e.target.value } : hv))} placeholder="https://..." />
                </label>
                <label style={s.label}>
                  <span style={s.labelText}>Poster (imagem de preview)</span>
                  <input style={s.input} value={v.poster} onChange={e => setHeroVideos(prev => prev.map((hv, hi) => hi === i ? { ...hv, poster: e.target.value } : hv))} placeholder="https://..." />
                </label>
                <div style={s.uploadArea} onClick={() => {
                  const inp = document.createElement("input");
                  inp.type = "file"; inp.accept = "video/*";
                  inp.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) uploadHeroVideo(i, f); };
                  inp.click();
                }}>
                  Ou clique para fazer upload do vídeo
                </div>
                {v.url && <video src={v.url} style={{ width: "100%", borderRadius: 8, marginTop: 8 }} controls muted />}
              </div>
            ))}
            <button style={s.btnPink} onClick={saveHeroVideos} disabled={loading}>
              {loading ? "Salvando..." : "Salvar hero videos"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
