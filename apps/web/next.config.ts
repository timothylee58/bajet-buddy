import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type checking and linting run as separate CI steps; skip during build.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
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
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
