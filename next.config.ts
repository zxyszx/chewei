import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
};

export default nextConfig;
