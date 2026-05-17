"use client";

// app/product/[id]/page.tsx
// Replace the contents of web/app/product/[id]/page.tsx with this file

import Link from "next/link";
import styles from "./product.module.css";

// ─── mock data (replace with real DB fetch later) ───────────────────────────
const PRODUCTS: Record<
  string,
  {
    name: string;
    tags: string[];
    available: boolean;
    coverImage: string;
    avatarImage: string;
    gallery: string[];
  }
> = {
  brunette002: {
    name: "BRUNETTE002",
    tags: ["#brunette", "#teen"],
    available: true,
    coverImage: "/models/brunette002-cover.jpg",
    avatarImage: "/models/brunette002.jpg",
    gallery: [
      "/models/brunette002-1.jpg",
      "/models/brunette002-2.jpg",
      "/models/brunette002-3.jpg",
    ],
  },
  redhead003: {
    name: "REDHEAD003",
    tags: ["#redhead", "#teen"],
    available: true,
    coverImage: "/models/redhead003-cover.jpg",
    avatarImage: "/models/redhead003.jpg",
    gallery: [
      "/models/redhead003-1.jpg",
      "/models/redhead003-2.jpg",
      "/models/redhead003-3.jpg",
    ],
  },
};

const PLANS = [
  {
    id: "basic",
    name: "BASIC",
    subtitle: "Starter Content Pack",
    description: "Essential content to get your Instagram moving.",
    price: "$549",
    highlight: false,
    items: [
      "25 Instagram Posts",
      "10 Instagram Stories",
      "10 Instagram Reels",
      "5 NSFW Wall Posts",
      "5 NSFW Images",
      "1 NSFW Banner",
      "LoRA",
    ],
    also: ["Usage rights", "LoRA Setup + deployment guidance", "Ongoing support"],
    bonus: null,
  },
  {
    id: "pro",
    name: "PRO",
    subtitle: "Most Popular",
    description: "The perfect balance of content and value for consistent growth.",
    price: "$649",
    highlight: true,
    items: [
      "50 Instagram Posts",
      "20 Instagram Stories",
      "25 Instagram Reels",
      "10 NSFW Wall Posts",
      "10 NSFW Images",
      "1 NSFW Banner",
      "LoRA",
    ],
    also: ["Usage rights", "LoRA Setup + deployment guidance", "Ongoing support"],
    bonus: null,
  },
  {
    id: "premium",
    name: "PREMIUM",
    subtitle: "Maximum Impact",
    description: "Maximize your presence with high-volume content and premium assets.",
    price: "$799",
    highlight: false,
    items: [
      "80 Instagram Posts",
      "30 Instagram Stories",
      "40 Instagram Reels",
      "20 NSFW Wall Posts",
      "20 NSFW Images",
      "1 NSFW Banner",
      "Custom LoRA",
    ],
    also: ["Usage rights", "LoRA Setup + deployment guidance", "Ongoing support"],
    bonus: "300 Premium Prompts Pack",
  },
];

function CheckIcon({ pink = false }: { pink?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <rect width="24" height="24" rx="4" fill={pink ? "#e91e8c" : "#111"} />
      <path
        d="M6 12l4 4 8-8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = PRODUCTS[params.id] ?? PRODUCTS["brunette002"];

  return (
    <div className={styles.page}>

      {/* ── HEADER ── */}
      <div className={styles.header}>
        <div className={styles.coverWrap}>
          <img
            src={product.coverImage}
            alt={product.name}
            className={styles.cover}
          />
        </div>
        <div className={styles.avatarWrap}>
          <img
            src={product.avatarImage}
            alt={product.name}
            className={styles.avatar}
          />
        </div>
        <div className={styles.headerInfo}>
          <div className={styles.nameRow}>
            <span className={styles.modelName}>{product.name}</span>
            <span className={styles.verifiedBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </span>
            {product.available && (
              <span className={styles.availableTag}>
                <span className={styles.availableDot} />
                AVAILABLE
              </span>
            )}
          </div>
          <a href="#plans" className={styles.seePlansBtn}>
            See plans
          </a>
        </div>
      </div>

      {/* ── GALLERY ── */}
      <div className={styles.gallery}>
        {product.gallery.map((img, i) => (
          <div key={i} className={styles.galleryItem}>
            <img src={img} alt="" className={styles.galleryImg} />
            <div className={styles.galleryBadge}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* ── PRICING ── */}
      <div id="plans" className={styles.pricing}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`${styles.planCard} ${plan.highlight ? styles.planHighlight : ""}`}
          >
            {plan.highlight && (
              <div className={styles.popularBadge}>
                <span>👍</span>
                <span>MOST<br />POPULAR</span>
              </div>
            )}

            <div className={styles.planName}>{plan.name}</div>
            <div className={styles.planSubtitle}>{plan.subtitle}</div>
            <p className={styles.planDesc}>{plan.description}</p>

            <div className={`${styles.priceBox} ${plan.highlight ? styles.priceBoxPink : ""}`}>
              <span className={styles.price}>{plan.price}</span>
              <span className={styles.pricePer}>/one-time</span>
            </div>

            <div className={styles.planSection}>What's included</div>
            <ul className={styles.planList}>
              {plan.items.map((item) => (
                <li key={item} className={styles.planItem}>
                  <CheckIcon pink />
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
            <ul className={styles.planList}>
              {plan.also.map((item) => (
                <li key={item} className={styles.planItem}>
                  <CheckIcon pink />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <Link
              href={`/checkout?plan=${plan.id}&product=${params.id}`}
              className={`${styles.buyBtn} ${plan.highlight ? styles.buyBtnPink : ""}`}
            >
              Get {plan.name}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
