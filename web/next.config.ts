import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Domínios externos permitidos para o next/image (Vercel Image Optimization)
    remotePatterns: [
      // Supabase Storage — imagens de produtos (cover, avatar, gallery)
      {
        protocol: "https",
        hostname: "tnfnhvclgyegqknczzmx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // CDN de assets de marketing (logos, depoimentos, sparkles)
      {
        protocol: "https",
        hostname: "cdn.prod.website-files.com",
      },
      // Unsplash — imagens de placeholder no canvas mock
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // Formatos modernos: AVIF tem melhor compressão que WebP, mas WebP é mais compatível
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
