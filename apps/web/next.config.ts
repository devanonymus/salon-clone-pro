import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
  async rewrites() {
    const api = (
      process.env.PLATFORM_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://api-production-6aa5.up.railway.app"
        : "http://127.0.0.1:8080")
    ).replace(/\/$/, "");
    return [
      { source: "/platform/:path*", destination: `${api}/platform/:path*` },
    ];
  },
};

export default nextConfig;
