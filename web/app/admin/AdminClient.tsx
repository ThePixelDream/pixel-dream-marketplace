"use client";

// web/app/admin/AdminClient.tsx

import { useState, useRef, useCallback, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
function sb() { return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY); }

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const TITLE_OPTIONS = ["BRUNETTE", "EBONY", "ASIAN", "LATINA", "REDHEAD", "BLONDE"] as const;
type TitleBase = (typeof TITLE_OPTIONS)[number];

const DEFAULT_TAGS = [
  "Cosplay", "Muscular", "Trans", "Small Tits", "Milf", "Pawg",
  "Slim", "Big Tits", "Curvy", "Teen", "Latina", "Asian",
  "Ebony", "Redhead", "Blonde", "Brunette", "Girl Next Door",
];

const PLAN_PRICES = { basic: 549, pro: 649, premium: 799 };

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Product = {
  id: string; title: string; slug: string; tags: string[];
  cover_image_url: string; avatar_image_url: string;
  gallery_urls: string[]; video_url: string;
  price_basic: number; price_pro: number; price_premium: number;
  currency: string; active: boolean; sold: boolean; created_at: string;
};
type Order = {
  id: string; plan: string; amount_cents: number; currency: string;
  status: string; payment_method: string; affiliate_code: string;
  created_at: string; products: { title: string };
};
type Commission = {
  id: string; amount_cents: number; rate: number; status: string;
  created_at: string; profiles: { email: string };
};
type HeroVideo = { url: string };
type MediaItem = { file?: File; url: string; type: "image" | "video" };

// ── THEME ─────────────────────────────────────────────────────────────────────
const C = {
  bg: "#0f0f10", surface: "#1a1a1f", surface2: "#222228",
  border: "#2e2e36", text: "#f0f0f2", muted: "#7a7a8a",
  pink: "#e91e8c", green: "#22c55e", red: "#ef4444",
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
  dropZone: (drag: boolean) => ({
    border: `2px dashed ${drag ? C.pink : C.border}`, borderRadius: 12, padding: 20,
    textAlign: "center" as const, cursor: "pointer", color: drag ? C.pink : C.muted,
    fontSize: 13, background: drag ? "rgba(233,30,140,0.05)" : C.surface2,
    transition: "all 150ms",
  }) as const,
};

// ── CROP MODAL ────────────────────────────────────────────────────────────────
function CropModal({ file, round, aspectW, aspectH, onDone, onCancel }: {
  file: File; round: boolean; aspectW: number; aspectH: number;
  onDone: (blob: Blob) => void; onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const objectUrl = useRef(URL.createObjectURL(file));

  const CW = 480;
  const CH = Math.round(CW * (aspectH / aspectW));

  function draw(sc: number, off: { x: number; y: number }) {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, CW, CH);
    if (round) { ctx.save(); ctx.beginPath(); ctx.arc(CW / 2, CH / 2, Math.min(CW, CH) / 2, 0, Math.PI * 2); ctx.clip(); }
    const w = img.naturalWidth * sc;
    const h = img.naturalHeight * sc;
    ctx.drawImage(img, CW / 2 - w / 2 + off.x, CH / 2 - h / 2 + off.y, w, h);
    if (round) ctx.restore();
  }

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      // fit-to-frame initial scale
      const scX = CW / img.naturalWidth;
      const scY = CH / img.naturalHeight;
      const fit = Math.min(scX, scY);
      setMinScale(fit);
      setScale(fit);
      setOffset({ x: 0, y: 0 });
      setTimeout(() => draw(fit, { x: 0, y: 0 }), 0);
    };
    img.src = objectUrl.current;
  }, []);

  useEffect(() => { draw(scale, offset); }, [scale, offset]);

  function save() {
    draw(scale, offset);
    canvasRef.current!.toBlob(b => { if (b) onDone(b); }, "image/jpeg", 0.92);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 16, alignItems: "center", border: `1px solid ${C.border}`, maxWidth: "95vw" }}>
        <div style={{ fontWeight: 800, color: C.text }}>Adjust photo</div>
        <div
          style={{ width: CW, height: CH, overflow: "hidden", borderRadius: round ? "50%" : 12, border: `2px solid ${C.border}`, cursor: "grab", position: "relative", background: "#000", maxWidth: "80vw" }}
          onMouseDown={e => { dragging.current = true; dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }; }}
          onMouseMove={e => {
            if (!dragging.current) return;
            const off = { x: dragStart.current.ox + e.clientX - dragStart.current.mx, y: dragStart.current.oy + e.clientY - dragStart.current.my };
            setOffset(off);
          }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
        >
          <canvas ref={canvasRef} width={CW} height={CH} style={{ display: "block" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
          <span style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>Zoom</span>
          <input type="range" min={minScale} max={minScale * 4} step={0.01} value={scale}
            onChange={e => setScale(Number(e.target.value))} style={{ flex: 1 }} />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btnOutline} onClick={onCancel}>Cancel</button>
          <button style={S.btnPink} onClick={save}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── MEDIA GRID (drag-to-reorder, unified upload) ───────────────────────────────
function MediaGrid({ items, onChange }: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}) {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [dropZoneDrag, setDropZoneDrag] = useState(false);

  function handleDragStart(i: number) { setDraggingIdx(i); }
  function handleDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDragOver(i); }
  function handleDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (draggingIdx === null || draggingIdx === i) { setDraggingIdx(null); setDragOver(null); return; }
    const next = [...items];
    const [moved] = next.splice(draggingIdx, 1);
    next.splice(i, 0, moved);
    onChange(next);
    setDraggingIdx(null); setDragOver(null);
  }
  function handleDragEnd() { setDraggingIdx(null); setDragOver(null); }
  function removeItem(i: number) { onChange(items.filter((_, idx) => idx !== i)); }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault(); setDropZoneDrag(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  }

  function addFiles(files: File[]) {
    const newItems: MediaItem[] = files.map(f => ({
      file: f,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("video") ? "video" : "image",
    }));
    // max 4 images + 1 video
    const combined = [...items, ...newItems];
    const images = combined.filter(i => i.type === "image").slice(0, 4);
    const videos = combined.filter(i => i.type === "video").slice(0, 1);
    onChange([...images, ...videos]);
  }

  function pickFiles() {
    const inp = document.createElement("input");
    inp.type = "file"; inp.multiple = true; inp.accept = "image/*,video/*";
    inp.onchange = () => addFiles(Array.from(inp.files ?? []));
    inp.click();
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        style={S.dropZone(dropZoneDrag)}
        onClick={pickFiles}
        onDragOver={e => { e.preventDefault(); setDropZoneDrag(true); }}
        onDragLeave={() => setDropZoneDrag(false)}
        onDrop={handleFileDrop}
      >
        <div style={{ fontSize: 22, marginBottom: 6 }}>📁</div>
        <div style={{ fontWeight: 600 }}>Drop files here or click to select</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Up to 4 images + 1 video · Drag to reorder · First image = card thumbnail</div>
      </div>

      {/* Media grid */}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 12 }}>
          {items.map((item, i) => (
            <div
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              style={{
                position: "relative", borderRadius: 8, overflow: "hidden",
                border: `2px solid ${dragOver === i ? C.pink : i === 0 ? C.green : C.border}`,
                cursor: "grab", opacity: draggingIdx === i ? 0.4 : 1,
                background: C.surface2,
              }}
            >
              {item.type === "image"
                ? <img src={item.url} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} alt="" />
                : <video src={item.url} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} muted />
              }
              {/* badge */}
              {i === 0 && (
                <div style={{ position: "absolute", top: 4, left: 4, background: C.green, color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 4, padding: "2px 5px" }}>CARD</div>
              )}
              {item.type === "video" && (
                <div style={{ position: "absolute", top: 4, left: 4, background: C.pink, color: "#fff", fontSize: 9, fontWeight: 800, borderRadius: 4, padding: "2px 5px" }}>VIDEO</div>
              )}
              <button
                onClick={() => removeItem(i)}
                style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.7)", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function slugify(t: string) { return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

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

// ── PRODUCT FORM (shared for new and edit) ────────────────────────────────────
function ProductForm({
  initialData,
  existingProducts,
  onSave,
  onCancel,
}: {
  initialData?: Product;
  existingProducts: Product[];
  onSave: (product: Product) => void;
  onCancel?: () => void;
}) {
  const isEdit = !!initialData;
  const [titleBase, setTitleBase] = useState<TitleBase | "">(
    initialData ? (TITLE_OPTIONS.find(o => initialData.title.startsWith(o)) ?? "") : ""
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags ?? []);
  const [availableTags, setAvailableTags] = useState<string[]>(() => {
    const extra = (initialData?.tags ?? []).filter(t => !DEFAULT_TAGS.includes(t));
    return [...DEFAULT_TAGS, ...extra];
  });
  const [newTagInput, setNewTagInput] = useState("");

  // Cover crop
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPrev, setCoverPrev] = useState(initialData?.cover_image_url ?? "");
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPrev, setAvatarPrev] = useState(initialData?.avatar_image_url ?? "");
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropRound, setCropRound] = useState(false);
  const [cropTarget, setCropTarget] = useState<"cover" | "avatar">("cover");
  const [coverDropDrag, setCoverDropDrag] = useState(false);
  const [avatarDropDrag, setAvatarDropDrag] = useState(false);

  // Media grid
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(() => {
    const items: MediaItem[] = [];
    (initialData?.gallery_urls ?? []).forEach(url => items.push({ url, type: "image" }));
    if (initialData?.video_url) items.push({ url: initialData.video_url, type: "video" });
    return items;
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  function getNextTitle(base: TitleBase) {
    const others = existingProducts.filter(p => p.title.startsWith(base) && p.id !== initialData?.id);
    const nums = others.map(p => { const m = p.title.match(/(\d+)$/); return m ? parseInt(m[1]) : 0; });
    return `${base}${String(nums.length ? Math.max(...nums) + 1 : 1).padStart(3, "0")}`;
  }

  function toggleTag(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  function addTag() {
    const t = newTagInput.trim();
    const formatted = t.replace(/\b\w/g, c => c.toUpperCase());
    if (!formatted || availableTags.includes(formatted)) return;
    setAvailableTags(p => [...p, formatted]);
    setSelectedTags(p => [...p, formatted]);
    setNewTagInput("");
  }

  function handleCropDrop(e: React.DragEvent, target: "cover" | "avatar") {
    e.preventDefault();
    setCoverDropDrag(false); setAvatarDropDrag(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setCropFile(file); setCropRound(target === "avatar"); setCropTarget(target);
    }
  }

  async function handleSave() {
    if (!titleBase) { setMsg("Please select a title."); return; }
    setLoading(true); setMsg("");
    try {
      const title = isEdit ? initialData!.title : getNextTitle(titleBase as TitleBase);
      const slug = slugify(title); // e.g. "asian010"

      let cover_image_url = initialData?.cover_image_url ?? "";
      let avatar_image_url = initialData?.avatar_image_url ?? "";
      const gallery_urls: string[] = [];
      let video_url = initialData?.video_url ?? "";

      if (coverBlob) cover_image_url = await uploadBlob(coverBlob, `${slug}/cover`);
      if (avatarBlob) avatar_image_url = await uploadBlob(avatarBlob, `${slug}/avatar`);

      // Process media items in order
      let imgIdx = 0;
      for (const item of mediaItems) {
        if (item.type === "image") {
          if (item.file) {
            const url = await uploadFile(item.file, `${slug}/gallery-${imgIdx}`);
            gallery_urls.push(url);
          } else {
            gallery_urls.push(item.url);
          }
          imgIdx++;
        } else if (item.type === "video") {
          if (item.file) {
            video_url = await uploadFile(item.file, `${slug}/video`);
          } else {
            video_url = item.url;
          }
        }
      }

      const payload = {
        title, slug, tags: selectedTags,
        cover_image_url, avatar_image_url, gallery_urls, video_url,
        price_basic: PLAN_PRICES.basic * 100,
        price_pro: PLAN_PRICES.pro * 100,
        price_premium: PLAN_PRICES.premium * 100,
        currency: "usd",
      };

      if (isEdit) {
        const { data, error } = await sb().from("products").update(payload).eq("id", initialData!.id).select().single();
        if (error) throw error;
        onSave(data as Product);
      } else {
        const { data, error } = await sb().from("products").insert({ ...payload, active: true, sold: false }).select().single();
        if (error) throw error;
        onSave(data as Product);
      }
    } catch (e: unknown) {
      setMsg("❌ " + (e instanceof Error ? e.message : String(e)));
    }
    setLoading(false);
  }

  return (
    <div>
      {cropFile && (
        <CropModal
          file={cropFile} round={cropRound}
          aspectW={cropTarget === "cover" ? 560 : 1}
          aspectH={cropTarget === "cover" ? 180 : 1}
          onDone={blob => {
            const url = URL.createObjectURL(blob);
            if (cropTarget === "cover") { setCoverBlob(blob); setCoverPrev(url); }
            else { setAvatarBlob(blob); setAvatarPrev(url); }
            setCropFile(null);
          }}
          onCancel={() => setCropFile(null)}
        />
      )}

      {msg && <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontWeight: 600, fontSize: 13, background: msg.startsWith("✅") ? "#14532d" : "#7f1d1d", color: msg.startsWith("✅") ? "#4ade80" : "#f87171" }}>{msg}</div>}

      {/* Title */}
      <div style={S.label}>
        <span style={S.labelText}>Title</span>
        <div style={S.toggleRow}>
          {TITLE_OPTIONS.map(opt => (
            <button key={opt} style={S.toggleBtn(titleBase === opt)} onClick={() => setTitleBase(opt)} disabled={isEdit}>{opt}</button>
          ))}
        </div>
        {titleBase && !isEdit && (
          <div style={{ marginTop: 6, fontSize: 13, color: C.muted }}>
            Will be named: <strong style={{ color: C.text }}>{getNextTitle(titleBase as TitleBase)}</strong>
          </div>
        )}
        {isEdit && <div style={{ marginTop: 6, fontSize: 13, color: C.muted }}>Title: <strong style={{ color: C.text }}>{initialData!.title}</strong></div>}
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
            onChange={e => setNewTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTag()} />
          <button style={S.btnPink} onClick={addTag}>Add tag</button>
        </div>
      </div>

      {/* Cover + Avatar */}
      <div style={S.grid2}>
        <div style={S.label}>
          <span style={S.labelText}>Cover photo (560×180)</span>
          <div
            style={S.dropZone(coverDropDrag)}
            onClick={() => pickFile("image/*", false, ([f]) => { setCropFile(f); setCropRound(false); setCropTarget("cover"); })}
            onDragOver={e => { e.preventDefault(); setCoverDropDrag(true); }}
            onDragLeave={() => setCoverDropDrag(false)}
            onDrop={e => handleCropDrop(e, "cover")}
          >
            {coverPrev
              ? <img src={coverPrev} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 8 }} alt="" />
              : <span>Click or drop image</span>
            }
          </div>
        </div>
        <div style={S.label}>
          <span style={S.labelText}>Avatar photo (circle)</span>
          <div
            style={S.dropZone(avatarDropDrag)}
            onClick={() => pickFile("image/*", false, ([f]) => { setCropFile(f); setCropRound(true); setCropTarget("avatar"); })}
            onDragOver={e => { e.preventDefault(); setAvatarDropDrag(true); }}
            onDragLeave={() => setAvatarDropDrag(false)}
            onDrop={e => handleCropDrop(e, "avatar")}
          >
            {avatarPrev
              ? <img src={avatarPrev} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "50%", margin: "0 auto" }} alt="" />
              : <span>Click or drop image</span>
            }
          </div>
        </div>
      </div>

      {/* Media grid */}
      <div style={S.label}>
        <span style={S.labelText}>Gallery & Video (drag to reorder · first image = card thumbnail)</span>
        <MediaGrid items={mediaItems} onChange={setMediaItems} />
      </div>

      {/* Plan prices */}
      <div style={S.grid3}>
        {(["basic", "pro", "premium"] as const).map(plan => (
          <div key={plan} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{plan}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text }}>${PLAN_PRICES[plan]}</div>
            <div style={{ fontSize: 11, color: C.muted }}>one-time</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
        <button style={S.btnPink} onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save changes" : "Create product"}
        </button>
        {onCancel && <button style={S.btnOutline} onClick={onCancel}>Cancel</button>}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
export default function AdminClient({
  products: init, orders, commissions, heroVideos: initHero,
}: {
  products: Product[]; orders: Order[]; commissions: Commission[];
  heroVideos: HeroVideo[]; supabaseUrl: string; supabaseAnonKey: string;
}) {
  const [tab, setTab] = useState<"products" | "new" | "orders" | "affiliates" | "hero">("products");
  const [products, setProducts] = useState(init);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [msg, setMsg] = useState("");
  const [heroVideos, setHeroVideos] = useState<HeroVideo[]>(
    Array.from({ length: 10 }, (_, i) => initHero[i] ?? { url: "" })
  );
  const [heroLoading, setHeroLoading] = useState(false);

  const totalRevenue = orders.filter(o => o.status === "paid").reduce((s, o) => s + o.amount_cents, 0);
  const totalOrders = orders.filter(o => o.status === "paid").length;
  const totalComm = commissions.reduce((s, c) => s + c.amount_cents, 0);

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
    setHeroLoading(true);
    await sb().from("site_settings").upsert({ key: "hero_videos", value: { videos: heroVideos } });
    setHeroLoading(false);
    setMsg("✅ Hero videos saved!");
  }

  // Edit mode
  if (editingProduct) {
    return (
      <div style={S.page}>
        <nav style={S.nav}>
          <span style={{ fontWeight: 800, fontSize: 16, color: C.text }}>Edit · {editingProduct.title}</span>
          <button style={S.btnOutline} onClick={() => setEditingProduct(null)}>← Back</button>
        </nav>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px" }}>
          <div style={S.card}>
            <ProductForm
              initialData={editingProduct}
              existingProducts={products}
              onSave={updated => {
                setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
                setEditingProduct(null);
                setMsg("✅ Product updated!");
              }}
              onCancel={() => setEditingProduct(null)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
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
                    {thumb ? <img src={thumb} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                      : <div style={{ width: 52, height: 52, borderRadius: 8, background: C.surface, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, color: C.text }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Basic ${p.price_basic / 100} · Pro ${p.price_pro / 100} · Premium ${p.price_premium / 100}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                        {(p.tags ?? []).map(t => <span key={t} style={{ fontSize: 11, color: C.muted, background: C.surface, borderRadius: 4, padding: "2px 6px" }}>#{t}</span>)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                      {p.sold && <span style={S.badge("red")}>SOLD</span>}
                      {!p.sold && <span style={S.badge(p.active ? "green" : "grey")}>{p.active ? "ACTIVE" : "INACTIVE"}</span>}
                      <button style={{ ...S.btnOutline, color: C.pink, borderColor: C.pink }} onClick={() => setEditingProduct(p)}>Edit</button>
                      <button style={S.btnOutline} onClick={() => toggleActive(p)}>{p.active ? "Deactivate" : "Activate"}</button>
                      <a href={`/product/${p.id}`} target="_blank" rel="noopener noreferrer"
                        style={{ ...S.btnOutline, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>View →</a>
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
            <ProductForm
              existingProducts={products}
              onSave={created => {
                setProducts(p => [created, ...p]);
                setMsg("✅ Product created!");
                setTab("products");
              }}
            />
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
            <div style={S.sectionTitle}>Hero Videos (10 slots)</div>
            <p style={{ color: C.muted, fontSize: 14, marginBottom: 20 }}>Configure up to 10 videos for the landing page carousel.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 20 }}>
              {heroVideos.map((v, i) => (
                <div key={i} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Video {i + 1}</div>
                  <div
                    style={{ background: C.bg, border: `1px dashed ${C.border}`, borderRadius: 8, height: 56, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12, color: v.url ? C.green : C.muted, marginBottom: 6 }}
                    onClick={() => pickFile("video/*", false, ([f]) => {
                      uploadFile(f, `hero/video-${i}-${Date.now()}`).then(url =>
                        setHeroVideos(prev => prev.map((hv, hi) => hi === i ? { url } : hv))
                      );
                    })}
                  >
                    {v.url ? "✓ Set" : "Upload"}
                  </div>
                  <input
                    style={{ ...S.input, fontSize: 11, height: 32, padding: "0 8px" }}
                    value={v.url}
                    onChange={e => setHeroVideos(prev => prev.map((hv, hi) => hi === i ? { url: e.target.value } : hv))}
                    placeholder="Paste URL..."
                  />
                </div>
              ))}
            </div>
            <button style={S.btnPink} onClick={saveHero} disabled={heroLoading}>
              {heroLoading ? "Saving..." : "Save hero videos"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
