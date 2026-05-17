"use client";

// app/marketplace/page.tsx
// Replace the contents of web/app/marketplace/page.tsx with this file

import Link from "next/link";
import styles from "./marketplace.module.css";

const models = [
  {
    id: "redhead003",
    name: "REDHEAD003",
    tags: ["#redhead", "#teen"],
    image: "/models/redhead003.jpg",
  },
  {
    id: "latina002",
    name: "LATINA002",
    tags: ["#latina", "#teen", "#girlnextdoor"],
    image: "/models/latina002.jpg",
  },
  {
    id: "asian001",
    name: "ASIAN001",
    tags: ["#asian", "#teen"],
    image: "/models/asian001.jpg",
  },
  {
    id: "brunette002",
    name: "BRUNETTE002",
    tags: ["#brunette", "#teen"],
    image: "/models/brunette002.jpg",
  },
];

export default function MarketplacePage() {
  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {models.map((model) => (
          <div key={model.id} className={styles.card}>
            <div className={styles.imageWrap}>
              <img
                src={model.image}
                alt={model.name}
                className={styles.image}
              />
              <div className={styles.badge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
            </div>
            <div className={styles.info}>
              <div className={styles.name}>{model.name}</div>
              <div className={styles.tags}>
                {model.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
              <Link href={`/product/${model.id}`} className={styles.btn}>
                View profile
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
