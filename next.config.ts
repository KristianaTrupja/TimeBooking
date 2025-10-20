import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizeCss: false, // 🔧 disables LightningCSS to avoid native module errors
  },
  logging: {
    incomingRequests: false
  }
};

export default nextConfig;
