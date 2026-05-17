"use client";

// web/app/admin/AdminClient.tsx

import { useState, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function sb() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ── CONSTANTS ────────────────────────────────────────────────
const TITLE_OPTIONS = ["BRUNETTE", "EBONY", "ASIAN", "LATINA", "REDHEAD", "BLONDE"] as const;
type TitleBase = (typeof TITLE_OPTIONS)[number];

const DEFAULT_TAGS = [
  "cosplay", "muscular", "trans", "small tits", "milf", "pawg",
  "slim", "big tits", "curvy", "teen", "latina", "asian",
  "ebony", "redhead", "blonde", "brunette", "girl next door",
];

const PLAN_PRICES = { basic: 549, pro: 649, premium: 799 };

// ── TYPES ────────────────────────────────────────────────────
type Product = {
  id: string;
  title: string;
  slug: string;
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

type HeroVideo = { url: string };

// ── COLORS ───────────────────────────────────────────────────
const C = {
  bg: "#0f0f10",
  surface: "#1a1a1f",
  surface2: "#222228",
  border: "#2e2e36",
  text: "#f0f0f2",
  muted: "#7a7a8a",
  pink: "#e91e8c",
  green: "#22c55e",
  red: "#ef4444",
};

const S = {
  page: { minHeight: "100vh", background: C.bg, fontFamily: "Inter, sans-serif", color: C.text } as const,
  nav: { background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 } as const,
  statsBar: { background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "12px 24px" } as const,
  statsInner: { maxWidth: 1100, margin: "0 auto", display: "flex", gap: 32 } as const,
  tabs: { display: "flex", borderBottom: `1px solid ${C.border}`, maxWidth: 1100, margin: "0 auto", padding: "16px 24px 0" } as const,
  tab: (on: boolean) => ({ padding: "10px 20px", borderRadius: "10px 10px 0 0", border: "none", background: on ? C.surface : "transparent", color: on ? C.text : C.muted, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }) as const,
  content: { maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px" } as const,
  card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: "0 16px 16px 16px", padding: 24, marginBottom: 16 } as const,
  sectionTitle: { fontSize: 18, fontWeight: 800, marginBottom: 20, color: C.text } as const,
  label: { display: "grid", gap: 6, marginBottom: 16 } as const,
  labelText: { fontWeight: 600, fontSize: 13, color: C.muted } as const,
  input: { height: 44, padding: "0 14px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 14, width: "100%", fontFamily: "inherit", background: C.surface2, color: C.text, boxSizing: "border-box" } as const,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } as const,
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 } as const,
  btnPink: { height: 44, borderRadius: 999, border: "none", background: C.pink, color: "#fff", fontWeight: 800, cursor: "pointer", padding: "0 28px", fontSize: 14, fontFamily: "inherit" } as const,
  btnOutline: { height: 34, borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.text, fontWeight: 600, cursor: "pointer", padding: "0 14px", fontSize: 12, fontFamily: "inherit" } as const,
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 } as const,
  th: { textAlign: "left" as const, padding: "8px 12px", fontWeight: 700, borderBottom: `1px solid ${C.border}`, color: C.muted, fontSize: 11, textTransform: "uppercase" as const, letterSpacing: "0.06em" } as const,
  td: { padding: "10px 12px", borderBottom: `1px solid ${C.border}`, verticalAlign: "middle" as const, color: C.text } as const,
  badge: (color: "green" | "red" | "grey") => ({
    display: "inline-block", padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: color === "green" ? "#14532d" : color === "red" ? "#7f1d1d" : C.surface2,
    color: color === "green" ? "#4ade80" : color === "red" ? "#f87171" : C.muted,
  }) as const,
  toggleRow: { display: "flex", flexWrap: "wrap" as const, gap: 8 } as const,
  toggleBtn: (on: boolean) => ({
    padding: "8px 16px", borderRadius: 8, border: `1px solid ${on ? C.pink : C.border}`,
    background: on ? C.pink : C.surface2, color: on ? "#fff" : C.muted,
    fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit",
  }) as const,
  uploadBox: { border: `2px dashed ${C.border}`, borderRadius: 12, padding: 16, textAlign: "center" as const, cursor: "pointer", color: C.muted, fontSize: 13, background: C.surface2 } as const,
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 } as const,
};

// ── CROP MODAL ───────────────────────────────────────────────
function CropModal({ file, round, onDone, onCancel }: {
  file: File; round: boolean;
  onDone: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const SIZE = 380;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const objectUrl = URL.createObjectURL(file);

  function draw(sc = scale, off = offset) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    if (round) { ctx.save(); ctx.beginPath(); ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2); ctx.clip(); }
    const w = img.naturalWidth * sc;
    const h = img.naturalHeight * sc;
    ctx.drawImage(img, SIZE / 2 - w / 2 + off.x, SIZE / 2 - h / 2 + off.y, w, h);
    if (round) ctx.restore();
  }

  function save() {
    const canvas = canvasRef.current!;
    draw();
    canvas.toBlob(b => { if (b) onDone(b); }, "image/jpeg", 0.92);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16, alignItems: "center", border: `1px solid ${C.border}` }}>
        <div style={{ fontWeight: 800, color: C.text }}>Adjust photo</div>
        <div
          style={{ width: SIZE, height: SIZE, overflow: "hidden", borderRadius: round ? "50%" : 12, border: `2px solid ${C.border}`, cursor: "grab", position: "relative", background: "#000" }}
          onMouseDown={e => { dragging.current = true; dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }; }}
          onMouseMove={e => {
            if (!dragging.current) return;
            const off = { x: dragStart.current.ox + e.clientX - dragStart.current.mx, y: dragStart.current.oy + e.clientY - dragStart.current.my };
            setOffset(off); draw(scale, off);
          }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
        >
          <img ref={imgRef} src={objectUrl} alt="" onLoad={() => draw()}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0, pointerEvents: "none" }} />
          <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ display: "block" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ color: C.muted, fontSize: 12 }}>Zoom</span>
          <input type="range" min={0.5} max={3} step={0.01} value={scale}
            onChange={e => { const sc = Number(e.target.value); setScale(sc); draw(sc, offset); }} style={{ flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btnOutline} onClick={onCancel}>Cancel</button>
          <button style={S.btnPink} onClick={save}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── HELPERS ──────────────────────────────────────────────────
function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function pickFile(accept: string, multiple: boolean, cb: (files: File[]) => void) {
  const inp = document.createElement("input");
  inp.type = "file"; inp.accept = accept; inp.multiple = multiple;
  inp.onchange = () => { const f = Array.from(inp.files ?? []); if (f.length) cb(f); };
  inp.click();
}

async function uploadBlob(blob: Blob, path: string) {
  const { error } = await sb().storage.from("products").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw error;
  return sb().storage.from("products").getPublicUrl(path).data.publicUrl;
}

async function uploadFile(file: File, path: string) {
  const { error } = await sb().storage.from("products").upload(path, file, { upsert: true });
  if (error) throw error;
  return sb().storage.from("products").getPublicUrl(path).data.publicUrl;
}

// ── COMPONENT ────────────────────────────────────────────────
export default function AdminClient({
  products: init,
  orders,
  commissions,
  heroVideos: initHero,
}: {
  products: Product[];
  orders: Order[];
  commissions: Commission[];
  heroVideos: HeroVideo[];
  supabaseUrl: string;
  supabaseAnonKey: string;
}) {
  const [tab, setTab] = useState<"products" | "new" | "orders" | "affiliates" | "hero">("products");
  const [products, setProducts] = useState(init);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // form
  const [titleBase, setTitleBase] = useState<TitleBase | "">("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState(DEFAULT_TAGS);
  const [newTagInput, setNewTagInput] = useState("");
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPrev, setCoverPrev] = useState("");
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPrev, setAvatarPrev] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPrevs, setGalleryPrevs] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropRound, setCropRound] = useState(false);
  const [cropTarget, setCropTarget] = useState<"cover" | "avatar">("cover");

  const [heroVideos, setHeroVideos] = useState<HeroVideo[]>(
    initHero.length >= 4 ? initHero : [{ url: "" }, { url: "" }, { url: "" }, { url: "" }]
  );

  const totalRevenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + o.amount_cents, 0);
  const totalOrders = orders.filter(o => o.status === "paid").length;
  const totalComm = commissions.reduce((s, c) => s + c.amount_cents, 0);

  function getNextTitle(base: TitleBase) {
    const nums = products
      .filter(p => p.title.startsWith(base))
      .map(p => { const m = p.title.match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
    return `${base}${String(nums.length ? Math.max(...nums) + 1 : 1).padStart(3, "0")}`;
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function addTag() {
    const t = newTagInput.trim().toLowerCase();
    if (!t || availableTags.includes(t)) return;
    setAvailableTags(p => [...p, t]);
    setSelectedTags(p => [...p, t]);
    setNewTagInput("");
  }

  function onCropDone(blob: Blob) {
    const url = URL.createObjectURL(blob);
    if (cropTarget === "cover") { setCoverBlob(blob); setCoverPrev(url); }
    else { setAvatarBlob(blob); setAvatarPrev(url); }
    setCropFile(null);
  }

  async function handleCreate() {
    if (!titleBase) { setMsg("Please select a title."); return; }
    setLoading(true); setMsg("");
    try {
      const title = getNextTitle(titleBase as TitleBase);
      const slug = slugify(title) + "-" + Date.now();
      let cover_image_url = "";
      let avatar_image_url = "";
      let video_url = "";
      const gallery_urls: string[] = [];
      if (coverBlob) cover_image_url = await uploadBlob(coverBlob, `${slug}/cover`);
      if (avatarBlob) avatar_image_url = await uploadBlob(avatarBlob, `${slug}/avatar`);
      if (videoFile) video_url = await uploadFile(videoFile, `${slug}/video`);
      for (let i = 0; i < galleryFiles.length; i++) {
        gallery_urls.push(await uploadFile(galleryFiles[i], `${slug}/gallery-${i}`));
      }
      const { data, error } = await sb().from("products").insert({
        title, slug, tags: selectedTags,
        cover_image_url, avatar_image_url, gallery_urls, video_url,
        price_basic: PLAN_PRICES.basic * 100,
        price_pro: PLAN_PRICES.pro * 100,
        price_premium: PLAN_PRICES.premium * 100,
        currency: "usd", active: true, sold: false,
      }).select().single();
      if (error) throw error;
      setProducts(p => [data as Product, ...p]);
      setTitleBase(""); setSelectedTags([]);
      setCoverBlob(null); setCoverPrev(""); setAvatarBlob(null); setAvatarPrev("");
      setGalleryFiles([]); setGalleryPrevs([]); setVideoFile(null);
      setMsg("✅ Product created!");
      setTab("products");
    } catch (e: unknown) {
      setMsg("❌ " + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  }

  async function toggleActive(p: Product) {
    await sb().from("products").update({ active: !p.active }).eq("id", p.id);
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await sb().from("products").delete().eq("id", id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function saveHero() {
    setLoading(true);
    await sb().from("site_settings").upsert({ key: "hero_videos", value: { videos: heroVideos } });
    setLoading(false);
    setMsg("✅ Saved!");
  }

  return (
    <div style={S.page}>
      {cropFile && (
        <CropModal file={cropFile} round={cropRound}
          onDone={onCropDone}
          onCancel={() => setCropFile(null)} />
      )}

      <nav style={S.nav}>
        <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>The Pixel Dream · Admin</span>
        <form action="/auth/logout" method="post">
          <button type="submit" style={S.btnOutline}>Sign out</button>
        </form>
      </nav>

      <div style={S.statsBar}>
        <div style={S.statsInner}>
          {[
            { label: "Total Revenue", val: `$${(totalRevenue / 100).toFixed(0)}` },
            { label: "Paid Orders", val: totalOrders },
            { label: "Active Products", val: products.filter(p => p.active && !p.sold).length },
            { label: "Commissions", val: `$${(totalComm / 100).toFixed(0)}` },
          ].map(st => (
            <div key={st.label}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{st.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: C.text }}>{st.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.tabs}>
        {(["products", "new", "orders", "affiliates", "hero"] as const).map(t => (
          <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>
            {{ products: "Products", new: "+ New", orders: "Sales", affiliates: "Affiliates", hero: "Hero Videos" }[t]}
          </button>
        ))}
      </div>

      <div style={S.content}>
        {msg && (
          <div style={{ padding: "12px 16px", borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: 14, background: msg.startsWith("✅") ? "#14532d" : "#7f1d1d", color: msg.startsWith("✅") ? "#4ade80" : "#f87171" }}>
            {msg}
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div style={S.card}>
            <div style={S.sectionTitle}>Products ({products.length})</div>
            {!products.length && <p style={{ color: C.muted }}>No products yet.</p>}
            <div style={{ display: "grid", gap: 10 }}>
              {products.map(p => {
                const thumb = p.gallery_urls?.[0] || p.cover_image_url;
                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface2 }}>
                    {thumb
                      ? <img src={thumb} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 52, height: 52, borderRadius: 8, background: C.surface, flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: C.text }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Basic ${p.price_basic / 100} · Pro ${p.price_pro / 100} · Premium ${p.price_premium / 100}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {(p.tags ?? []).map(t => <span key={t} style={{ fontSize: 11, color: C.muted, background: C.surface, borderRadius: 4, padding: "2px 6px" }}>#{t}</span>)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      {p.sold && <span style={S.badge("red")}>SOLD</span>}
                      {!p.sold && <span style={S.badge(p.active ? "green" : "grey")}>{p.active ? "ACTIVE" : "INACTIVE"}</span>}
                      <button style={S.btnOutline} onClick={() => toggleActive(p)}>{p.active ? "Deactivate" : "Activate"}</button>
                      <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer"
                        style={{ ...S.btnOutline, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>
                        View →
                      </a>
                      <button style={{ ...S.btnOutline, color: C.red, borderColor: "#7f1d1d" }} onClick={() => deleteProduct(p.id)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* NEW PRODUCT */}
        {tab === "new" && (
          <div style={S.card}>
            <div style={S.sectionTitle}>New Product</div>

            {/* Title */}
            <div style={S.label}>
              <span style={S.labelText}>Title</span>
              <div style={S.toggleRow}>
                {TITLE_OPTIONS.map(opt => (
                  <button key={opt} style={S.toggleBtn(titleBase === opt)} onClick={() => setTitleBase(opt)}>{opt}</button>
                ))}
              </div>
              {titleBase && (
                <div style={{ marginTop: 8, fontSize: 13, color: C.muted }}>
                  Will be named: <strong style={{ color: C.text }}>{getNextTitle(titleBase as TitleBase)}</strong>
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={S.label}>
              <span style={S.labelText}>Tags</span>
              <div style={S.toggleRow}>
                {availableTags.map(tag => (
                  <button key={tag} style={S.toggleBtn(selectedTags.includes(tag))} onClick={() => toggleTag(tag)}>{tag}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input style={{ ...S.input, flex: 1 }} placeholder="Add new tag..." value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addTag()} />
                <button style={S.btnPink} onClick={addTag}>Add tag</button>
              </div>
            </div>

            {/* Cover + Avatar */}
            <div style={S.grid2}>
              <div style={S.label}>
                <span style={S.labelText}>Cover photo (banner)</span>
                <div style={S.uploadBox} onClick={() => pickFile("image/*", false, ([f]) => { setCropFile(f); setCropRound(false); setCropTarget("cover"); })}>
                  {coverPrev
                    ? <img src={coverPrev} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 8 }} alt="" />
                    : <span>Click to select</span>}
                </div>
              </div>
              <div style={S.label}>
                <span style={S.labelText}>Avatar photo (circle)</span>
                <div style={S.uploadBox} onClick={() => pickFile("image/*", false, ([f]) => { setCropFile(f); setCropRound(true); setCropTarget("avatar"); })}>
                  {avatarPrev
                    ? <img src={avatarPrev} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "50%", margin: "0 auto" }} alt="" />
                    : <span>Click to select</span>}
                </div>
              </div>
            </div>

            {/* Gallery */}
            <div style={S.label}>
              <span style={S.labelText}>Gallery (up to 4 photos)</span>
              <div style={S.uploadBox} onClick={() => pickFile("image/*", true, files => {
                const sel = files.slice(0, 4);
                setGalleryFiles(sel);
                setGalleryPrevs(sel.map(f => URL.createObjectURL(f)));
              })}>
                {galleryPrevs.length
                  ? <div style={S.previewGrid}>
                      {galleryPrevs.map((u, i) => <img key={i} src={u} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 8 }} alt="" />)}
                    </div>
                  : <span>Click to select up to 4 photos</span>
                }
              </div>
            </div>

            {/* Video */}
            <div style={S.label}>
              <span style={S.labelText}>Video (mp4)</span>
              <div style={S.uploadBox} onClick={() => pickFile("video/*", false, ([f]) => setVideoFile(f))}>
                {videoFile
                  ? <video src={URL.createObjectURL(videoFile)} style={{ width: "100%", borderRadius: 8, maxHeight: 200 }} controls muted />
                  : <span>Click to select video</span>
                }
              </div>
            </div>

            {/* Plan prices display */}
            <div style={S.grid3}>
              {(["basic", "pro", "premium"] as const).map(plan => (
                <div key={plan} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{plan}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>${PLAN_PRICES[plan]}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>one-time</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <button style={S.btnPink} onClick={handleCreate} disabled={loading}>
                {loading ? "Saving..." : "Create product"}
              </button>
            </div>
          </div>
        )}

        {/* SALES */}
        {tab === "orders" && (
          <div style={S.card}>
            <div style={S.sectionTitle}>Sales</div>
            <table style={S.table}>
              <thead><tr>{["Product", "Plan", "Amount", "Status", "Method", "Affiliate", "Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td style={S.td}>{o.products?.title ?? "-"}</td>
                    <td style={S.td}>{o.plan?.toUpperCase()}</td>
                    <td style={S.td}>${(o.amount_cents / 100).toFixed(2)}</td>
                    <td style={S.td}><span style={S.badge(o.status === "paid" ? "green" : "red")}>{o.status}</span></td>
                    <td style={S.td}>{o.payment_method ?? "-"}</td>
                    <td style={S.td}>{o.affiliate_code ?? "-"}</td>
                    <td style={S.td}>{new Date(o.created_at).toLocaleDateString("en-US")}</td>
                  </tr>
                ))}
                {!orders.length && <tr><td colSpan={7} style={{ ...S.td, color: C.muted }}>No sales yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* AFFILIATES */}
        {tab === "affiliates" && (
          <div style={S.card}>
            <div style={S.sectionTitle}>Affiliate Commissions</div>
            <table style={S.table}>
              <thead><tr>{["Affiliate", "Commission", "Rate", "Status", "Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id}>
                    <td style={S.td}>{c.profiles?.email ?? "-"}</td>
                    <td style={S.td}>${(c.amount_cents / 100).toFixed(2)}</td>
                    <td style={S.td}>{(Number(c.rate) * 100).toFixed(0)}%</td>
                    <td style={S.td}><span style={S.badge(c.status === "paid" ? "green" : "grey")}>{c.status}</span></td>
                    <td style={S.td}>{new Date(c.created_at).toLocaleDateString("en-US")}</td>
                  </tr>
                ))}
                {!commissions.length && <tr><td colSpan={5} style={{ ...S.td, color: C.muted }}>No commissions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* HERO VIDEOS */}
        {tab === "hero" && (
          <div style={S.card}>
            <div style={S.sectionTitle}>Hero Videos</div>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 24 }}>Configure the 4 videos in the landing page carousel.</p>
            {heroVideos.map((v, i) => (
              <div key={i} style={{ marginBottom: 16, padding: 16, border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface2 }}>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 10 }}>Video {i + 1}</div>
                <div style={S.uploadBox} onClick={() => pickFile("video/*", false, ([f]) => {
                  uploadFile(f, `hero/video-${i}-${Date.now()}`).then(url => {
                    setHeroVideos(prev => prev.map((hv, hi) => hi === i ? { url } : hv));
                  });
                })}>
                  {v.url
                    ? <video src={v.url} style={{ width: "100%", borderRadius: 8, maxHeight: 160 }} controls muted />
                    : <span>Click to upload video</span>
                  }
                </div>
                <input style={{ ...S.input, marginTop: 8 }} value={v.url}
                  onChange={e => setHeroVideos(prev => prev.map((hv, hi) => hi === i ? { url: e.target.value } : hv))}
                  placeholder="Or paste video URL..." />
              </div>
            ))}
            <button style={S.btnPink} onClick={saveHero} disabled={loading}>
              {loading ? "Saving..." : "Save hero videos"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
