import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Type checking runs as a separate CI step; skip during build.
  typescript: { ignoreBuildErrors: true },
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
    const rawApiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    // Netlify's build has been seen with NEXT_PUBLIC_API_URL set to a bare
    // host (no scheme), which Next.js rejects as an invalid rewrite
    // destination — default to https:// rather than fail the whole build.
    const apiBase = /^https?:\/\//.test(rawApiBase) ? rawApiBase : `https://${rawApiBase}`;
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
