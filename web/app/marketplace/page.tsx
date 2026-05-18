// web/app/product/[id]/page.tsx

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import styles from "./product.module.css";

export const dynamic = "force-dynamic";

const PLANS = [
  {
    id: "basic", name: "BASIC", subtitle: "Starter Content Pack",
    description: "Essential content to get your Instagram moving.",
    priceKey: "price_basic" as const, highlight: false, bonus: null,
    items: ["25 Instagram Posts","10 Instagram Stories","10 Instagram Reels","5 NSFW Wall Posts","5 NSFW Images","1 NSFW Banner","LoRA"],
  },
  {
    id: "pro", name: "PRO", subtitle: "Most Popular",
    description: "The perfect balance of content and value for consistent growth.",
    priceKey: "price_pro" as const, highlight: true, bonus: null,
    items: ["50 Instagram Posts","20 Instagram Stories","25 Instagram Reels","10 NSFW Wall Posts","10 NSFW Images","1 NSFW Banner","LoRA"],
  },
  {
    id: "premium", name: "PREMIUM", subtitle: "Maximum Impact",
    description: "Maximize your presence with high-volume content and premium assets.",
    priceKey: "price_premium" as const, highlight: false, bonus: "300 Premium Prompts Pack",
    items: ["80 Instagram Posts","30 Instagram Stories","40 Instagram Reels","20 NSFW Wall Posts","20 NSFW Images","1 NSFW Banner","Custom LoRA"],
  },
];

function CheckIcon() {
  return (
    <svg 
      width="10" 
      height="10" 
      viewBox="0 0 24 24" 
      fill="none" 
      style={{ flexShrink: 0, marginTop: "2px", width: "10px", height: "10px" }}
    >
      <rect width="24" height="24" rx="5" fill="#e91e8c" />
      <path d="M6 12l4 4 8-8" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const { data: product } = await supabase
    .from("products").select("*")
    .eq(isUuid ? "id" : "slug", id)
    .maybeSingle();

  if (!product) notFound();

  const gallery: string[] = product.gallery_urls ?? [];
  const videoUrl: string = product.video_url ?? "";

  return (
    <div className={styles.page}>

      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.coverWrap}>
          {product.cover_image_url
            ? <img src={product.cover_image_url} alt={product.title} className={styles.cover} />
            : <div className={styles.coverPlaceholder} />
          }
          <div className={styles.avatarWrap}>
            {product.avatar_image_url
              ? <img src={product.avatar_image_url} alt="" className={styles.avatar} />
              : <div className={styles.avatarPlaceholder} />
            }
          </div>
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <span className={styles.modelName}>{product.title}</span>
            <span className={styles.verifiedBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </span>
            {!product.sold && product.active && (
              <span className={styles.availableTag}>
                <span className={styles.availableDot} />
                AVAILABLE
              </span>
            )}
            {product.sold && <span className={styles.soldTag}>SOLD</span>}
          </div>
          {(product.tags ?? []).length > 0 && (
            <div className={styles.tagRow}>
              {product.tags.map((t: string) => (
                <span key={t} className={styles.tag}>#{t}</span>
              ))}
            </div>
          )}
          {!product.sold && (
            <a href="#plans" className={styles.seePlansBtn}>See plans</a>
          )}
          {product.sold && (
            <div className={styles.soldMsg}>This model has already been acquired.</div>
          )}
        </div>
      </div>

      {/* MEDIA — Carrossel de Mídias original e limpo */}
      {(gallery.length > 0 || videoUrl) && (
        <div className={styles.mediaRow}>
          <div className={styles.mediaTrack}>
            
            {/* PRIMEIRA LEVA (Original) */}
            {gallery.map((url, i) => (
              <div key={`orig-img-${i}`} className={styles.mediaItem}>
                <img src={url} alt="" className={styles.mediaImg} />
              </div>
            ))}
            {videoUrl && (
              <div className={styles.mediaItem}>
                <video src={videoUrl} className={styles.mediaVideo} muted playsInline loop autoPlay />
              </div>
            )}

            {/* SEGUNDA LEVA (Cópia para o efeito de loop) */}
            {gallery.map((url, i) => (
              <div key={`dup-img-${i}`} className={`${styles.mediaItem} ${styles.mediaItemDup}`} aria-hidden="true">
                <img src={url} alt="" className={styles.mediaImg} />
              </div>
            ))}
            {videoUrl && (
              <div className={styles.mediaItem} aria-hidden="true">
                <video src={videoUrl} className={styles.mediaVideo} muted playsInline loop autoPlay />
              </div>
            )}

          </div>
        </div>
      )}

      {/* PRICING */}
      {!product.sold && (
        <div id="plans" className={styles.pricing}>
          {PLANS.map((plan) => {
            const price = product[plan.priceKey] as number;
            return (
              <div key={plan.id} className={`${styles.planCard} ${plan.highlight ? styles.planHighlight : ""}`}>
                {plan.highlight && (
                  <div className={styles.popularBadge}>
                    <span>👍</span>
                    <span>MOST<br />POPULAR</span>
                  </div>
                )}
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planSubtitle}>{plan.subtitle}</div>
                <p className={styles.planDesc}>{plan.description}</p>
                <div className={styles.priceBox}>
                  <span className={styles.price}>${(price / 100).toFixed(0)}</span>
                  <span className={styles.pricePer}>/one-time</span>
                </div>
                
                <ul className={styles.planList}>
                  {plan.items.map((item) => (
                    <li key={item} className={styles.planItem}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {plan.bonus && (
                  <div className={styles.bonus}>
                    <span className={styles.bonusIcon}>🎁</span>
                    <div>
                      <div className={styles.bonusLabel}>EXCLUSIVE BONUS</div>
                      <div className={styles.bonusText}>{plan.bonus}</div>
                    </div>
                  </div>
                )}
                
                <div className={styles.divider} />
                <div className={styles.alsoLabel}>ALL PLANS ALSO INCLUDE</div>
                <ul className={styles.planList} style={{ marginBottom: 20 }}>
                  {["Usage rights", "LoRA Setup + deployment guidance", "Ongoing support"].map((item) => (
                    <li key={item} className={styles.planItem}>
                      <CheckIcon />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/checkout?plan=${plan.id}&product=${product.id}`}
                  className={styles.buyBtn}
                >
                  Get {plan.name}
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
