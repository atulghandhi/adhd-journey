import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  transpilePackages: ["@focuslab/shared"],
};

export default nextConfig;
