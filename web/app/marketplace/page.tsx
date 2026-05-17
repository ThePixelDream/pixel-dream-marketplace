// web/app/marketplace/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import styles from "./marketplace.module.css";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const supabase = await createSupabaseServerClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, title, tags, cover_image_url, gallery_urls, sold, active")
    .eq("active", true)
    .eq("sold", false)
    .order("created_at", { ascending: false });

  const list = products ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Marketplace</h1>
        <p className={styles.headerSub}>{list.length} model{list.length !== 1 ? "s" : ""} available</p>
      </div>
      {list.length === 0 ? (
        <div className={styles.empty}>No models available at the moment.</div>
      ) : (
        <div className={styles.grid}>
          {list.map((product) => {
            const thumb = (product.gallery_urls as string[])?.[0] || product.cover_image_url;
            return (
              <div key={product.id} className={styles.card}>
                <div className={styles.imageWrap}>
                  {thumb
                    ? <img src={thumb} alt={product.title} className={styles.image} />
                    : <div className={styles.imagePlaceholder} />
                  }
                  <div className={styles.badge}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  </div>
                </div>
                <div className={styles.info}>
                  <div className={styles.name}>{product.title}</div>
                  <div className={styles.tags}>
                    {((product.tags as string[]) ?? []).map((tag) => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                  <Link href={`/product/${product.id}`} className={styles.btn}>View profile</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
