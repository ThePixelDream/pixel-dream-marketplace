// web/app/layout.tsx

// ... seus outros imports e metadata ...

// CORRIGIDO: Removida a linha do backgroundColor que causava o erro
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
        <Header /> {/* <-- O cabeçalho inserido aqui vai aparecer no topo de TODAS as páginas */}
        {children}
      </body>
    </html>
  );
}
