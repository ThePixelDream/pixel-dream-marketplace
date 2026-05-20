// web/app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, Funnel_Display } from "next/font/google";
import localFont from "next/font/local";
import Header from "./components/Header";

// ─── Fontes via next/font/google (zero render-blocking, auto-hosted) ─────────
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  // Fraunces é uma fonte variável — sem weight fixo, axes podem ser usados
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-fraunces",
});

const funnelDisplay = Funnel_Display({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-funnel-display",
});

// ─── Fonte local: Redaction 35 (não disponível no Google Fonts) ──────────────
const redaction35 = localFont({
  src: "./fonts/Redaction35-Italic.otf",
  display: "swap",
  variable: "--font-redaction35",
  style: "italic",
});

export const metadata: Metadata = {
  title: "The Pixel Dream — AI OFM",
  description:
    "Ultra realistic AI models built to monetize. Licensing, acquisition, and creator revenue.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${funnelDisplay.variable} ${redaction35.variable}`}
    >
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        {/*
          CDNs externos removidos (fonts.googleapis.com, cdn.jsdelivr.net).
          Todas as fontes agora são servidas pelo next/font — auto-hospedadas
          na Vercel, com font-display: swap e sem render-blocking.
        */}
      </head>
      <body>
        <div id="app-root">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
