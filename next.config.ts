import type { NextConfig } from "next";

// 从 ALLOWED_DOWNLOAD_DOMAINS 读取允许的图片域名（逗号分隔）
const allowedDomains = (process.env.ALLOWED_DOWNLOAD_DOMAINS ?? '')
  .split(',')
  .map(d => d.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 兼容 nesslabs.cn 下所有子域
      { protocol: 'https', hostname: '**.nesslabs.cn' },
      // R2 自定义域名（通过环境变量配置）
      ...allowedDomains.map(hostname => ({
        protocol: 'https' as const,
        hostname,
      })),
    ],
  },
};

export default nextConfig;
