// web/app/support/page.tsx

import Link from "next/link";
import styles from "../components/legal.module.css";

export const metadata = {
  title: "Help & Support - Pixel Dream Marketplace",
};

export default function SupportPage() {
  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        ← Back to Marketplace
      </Link>
      
      <div className={styles.card}>
        <h1 className={styles.title}>Help & Support</h1>
        <div className={styles.subtitle}>Frequently Asked Questions & Technical Help</div>

        <div className={styles.section}>
          <h2>Q: How do I access my purchased assets?</h2>
          <p>
            Immediately after Stripe confirms your payment, your account will be updated with your delivery package. You will receive access to the direct download links for the high-resolution media grid, video files, and the specific LoRA deployment files associated with your chosen plan.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Q: What is a LoRA and how do I use it?</h2>
          <p>
            A LoRA (Low-Rank Adaptation) is a lightweight AI model trained specifically to produce consistent visual outputs of a model's face and style. Premium plans include deployment guidance, enabling you to use this file in popular interfaces like Automatic1111, ComfyUI, or cloud generation platforms to create custom, infinite new poses and scenarios.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Q: Can I use these images for commercial accounts?</h2>
          <p>
            Yes! All content packs and models purchased on our platform come with commercial usage rights for your personal digital brand or subscription funnels (such as OnlyFans, Instagram subscriptions, Fansly, etc.). However, you may not resell the source file models or prompts to other creators.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Q: Why was my transaction declined?</h2>
          <p>
            Transactions are monitored and approved by Stripe's security network. Please verify that your billing postal code matches your credit card registry, or try using an alternative payment option.
          </p>
        </div>

        <div className={styles.section}>
          <h2>Q: I need help setting up my model. Who can I talk to?</h2>
          <p>
            Our Pro and Premium plans include ongoing priority assistance. If you hit a wall during configuration or need guidance on generation parameters, our support line is open.
          </p>
        </div>

        <div className={styles.contactBox}>
          <p>Still need assistance? Open a support ticket:</p>
          <a href="mailto:support@pixeldream.com" className={styles.contactBtn}>
            Open Support Ticket
          </a>
        </div>
      </div>
    </div>
  );
}
