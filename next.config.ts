import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acesso ao dev server por outros dispositivos na rede local (celular, tablet)
  allowedDevOrigins: ["192.168.1.*", "*.local"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
