// web/app/terms/page.tsx

import Link from "next/link";
import styles from "../components/legal.module.css"; // Ajuste o caminho do CSS se necessário

export const metadata = {
  title: "Terms of Service - Pixel Dream Marketplace",
};

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Back to Marketplace
      </Link>
      
      <div className={styles.card}>
        <h1 className={styles.title}>Terms of Service</h1>
        <div className={styles.subtitle}>Last updated: May 2026</div>

        <div className={styles.section}>
          <h2>1. Agreement to Terms</h2>
          <p>
            By accessing or purchasing from Pixel Dream Marketplace, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you are prohibited from using this platform.
          </p>
        </div>

        <div className={styles.section}>
          <h2>2. Digital Products & Refund Policy</h2>
          <p>
            Due to the nature of digital deliverables (including but not limited to AI Models, LoRAs, images, promotional content packages, and prompts), <strong>all sales are final</strong>.
          </p>
          <p>
            Once access to the downloadable assets or configurations is granted, we cannot offer refunds, returns, or exchanges under any circumstance. Please review the model specifications, preview gallery, and plan inclusions carefully before completing your purchase.
          </p>
        </div>

        <div className={styles.section}>
          <h2>3. Usage Rights & License</h2>
          <p>
            When you purchase a Content Pack or LoRA bundle, you are granted a non-exclusive, non-transferable license to use the generated content for your marketing, social media (Instagram, Reels, OnlyFans, etc.), and promotional growth.
          </p>
          <ul>
            <li>You may modify the images or deploy the LoRA configurations for your personal or commercial brand development.</li>
            <li>You may not resell, sub-license, or redistribute the raw source assets, LoRA weights, or prompt packs as standalone products.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. Model Content & Limitations</h2>
          <p>
            The models and assets available on this platform are generated using advanced artificial intelligence. Variations in rendering, stylistic outputs, and prompt compatibility are inherent to AI technology. Continued support and setup guidance are provided based on the selected tier.
          </p>
        </div>

        <div className={styles.section}>
          <h2>5. Limitation of Liability</h2>
          <p>
            Pixel Dream Marketplace and its creators shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the purchased assets, or performance fluctuations on third-party AI deployment platforms.
          </p>
        </div>

        <div className={styles.contactBox}>
          <p>Questions about our Terms?</p>
          <a href="mailto:support@pixeldream.com" className={styles.contactBtn}>
            Contact Legal Support
          </a>
        </div>
      </div>
    </div>
  );
}
