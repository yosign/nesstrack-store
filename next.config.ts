import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'work.nesslabs.cn',
      },
    ],
  },
};

export default nextConfig;
