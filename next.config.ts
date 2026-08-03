import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Increase proxy response size limit to handle large base64 evidence photos
    proxyTimeout: 60000,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'https://perfectly-detail-gory.ngrok-free.dev';
    return [
      {
        source: '/api/ai-service/:path*',
        destination: 'http://127.0.0.1:8010/:path*',
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/hubs/:path*',
        destination: `${backendUrl}/hubs/:path*`,
      },
    ];
  },
};

export default nextConfig;
