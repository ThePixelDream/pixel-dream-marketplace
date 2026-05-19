// web/app/privacy/page.tsx

import Link from "next/link";
import styles from "../components/legal.module.css";

export const metadata = {
  title: "Privacy Policy - Pixel Dream Marketplace",
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Back to Marketplace
      </Link>
      
      <div className={styles.card}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <div className={styles.subtitle}>Last updated: May 2026</div>

        <div className={styles.section}>
          <h2>1. Information We Collect</h2>
          <p>
            We collect basic information required to process your secure purchases and manage your account credentials via Supabase. This includes your email address, account authentication details, and purchase history.
          </p>
        </div>

        <div className={styles.section}>
          <h2>2. Payment Processing & Security</h2>
          <p>
            Your financial security is paramount. Payment processing is handled exclusively through <strong>Stripe</strong>. Pixel Dream Marketplace never stores, processes, or sees your credit card numbers, banking details, or billing credentials on our servers. All transaction data is encrypted via Secure Socket Layer (SSL) by Stripe.
          </p>
        </div>

        <div className={styles.section}>
          <h2>3. How We Use Your Data</h2>
          <p>We use the collected information solely to:</p>
          <ul>
            <li>Deliver your digital downloads, access tokens, and setup guidance packs.</li>
            <li>Verify transaction status and handle customer support requests.</li>
            <li>Send essential transaction receipts and updates regarding your specific model assets.</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2>4. Data Retention & Third Parties</h2>
          <p>
            We do not sell, trade, or lease your personal information to third parties. Data is stored securely through our database infrastructure (Supabase) and is only retained for as long as necessary to guarantee access to your purchased licenses.
          </p>
        </div>

        <div className={styles.section}>
          <h2>5. Cookies</h2>
          <p>
            We use strictly necessary functional cookies to maintain your active login state and keep your secure checkout session active.
          </p>
        </div>

        <div className={styles.contactBox}>
          <p>Want to request data deletion or privacy inquiries?</p>
          <a href="mailto:privacy@pixeldream.com" className={styles.contactBtn}>
            Privacy Center
          </a>
        </div>
      </div>
    </div>
  );
}
