import type { NextConfig } from "next";

const isNetlify = process.env.NETLIFY === "true";

const nextConfig: NextConfig = {
  // Standalone uniquement pour Docker, pas pour Netlify
  ...(isNetlify ? {} : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Images optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@prisma/client'],
  },
};

export default nextConfig;
