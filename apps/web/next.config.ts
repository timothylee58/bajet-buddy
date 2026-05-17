import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  // Raise body size limit so large base64 image payloads (bank statements,
  // receipts) can pass through the /api/* rewrite proxy to FastAPI without
  // being rejected by Next.js's default 1 MB limit.
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
