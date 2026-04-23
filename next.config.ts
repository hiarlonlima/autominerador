import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fbcdn.net" },
      { protocol: "https", hostname: "**.facebook.com" },
      { protocol: "https", hostname: "scontent.**" },
    ],
  },
  // `serverExternalPackages` é preciso pro Turbopack em dev, mas faz o Vercel
  // perder o trace de deps transitivas do apify-client em prod (proxy-agent etc).
  // `outputFileTracingIncludes` força essas deps no bundle serverless.
  serverExternalPackages: ["apify-client"],
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./node_modules/apify-client/**/*",
      "./node_modules/proxy-agent/**/*",
      "./node_modules/pac-proxy-agent/**/*",
      "./node_modules/socks-proxy-agent/**/*",
      "./node_modules/https-proxy-agent/**/*",
      "./node_modules/http-proxy-agent/**/*",
      "./node_modules/agent-base/**/*",
      "./node_modules/pac-resolver/**/*",
      "./node_modules/degenerator/**/*",
      "./node_modules/netmask/**/*",
      "./node_modules/get-uri/**/*",
      "./node_modules/data-uri-to-buffer/**/*",
    ],
  },
};

export default nextConfig;
