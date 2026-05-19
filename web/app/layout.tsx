// web/app/layout.tsx
import "./globals.css";
import type { Metadata, Viewport } from "next";
import Header from "./components/Header";

export const metadata: Metadata = {
  title: "The Pixel Dream — AI OFM",
  description:
    "Ultra realistic AI models built to monetize. Licensing, acquisition, and creator revenue.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark", // Força o sistema do navegador a renderizar os elementos nativos como dark
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/redaction-35@5.2.5/400-italic.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/redaction-35@5.2.5/700-italic.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* 🌟 ENVELOPE ESCURO DO SISTEMA: Tudo dentro daqui roda isolado */}
        <div id="app-root">
          <Header />
          {children}
        </div>
      </body>
    </html>
  );
}
