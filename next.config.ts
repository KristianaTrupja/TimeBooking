import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizeCss: false, // 🔧 disables LightningCSS to avoid native module errors
    optimizePackageImports: ['lucide-react', '@headlessui/react', '@radix-ui/react-select'],
  },
  logging: {
    incomingRequests: false
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
