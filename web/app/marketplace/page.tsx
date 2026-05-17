// web/app/marketplace/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import styles from "./marketplace.module.css";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const supabase = await createSupabaseServerClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, slug, tags, cover_image_url, sold, active")
    .eq("active", true)
    .eq("sold", false)
    .order("created_at", { ascending: false });

  const list = products ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Marketplace</h1>
        <p className={styles.headerSub}>
          {list.length} modelo{list.length !== 1 ? "s" : ""} disponível{list.length !== 1 ? "is" : ""}
        </p>
      </div>

      {list.length === 0 ? (
        <div className={styles.empty}>Nenhum modelo disponível no momento.</div>
      ) : (
        <div className={styles.grid}>
          {list.map((product) => (
            <div key={product.id} className={styles.card}>
              <div className={styles.imageWrap}>
                {product.cover_image_url ? (
                  <img
                    src={product.cover_image_url}
                    alt={product.title}
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.imagePlaceholder} />
                )}
                <div className={styles.badge}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                </div>
              </div>
              <div className={styles.info}>
                <div className={styles.name}>{product.title}</div>
                <div className={styles.tags}>
                  {(product.tags ?? []).map((tag: string) => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
                <Link href={`/product/${product.id}`} className={styles.btn}>
                  View profile
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
