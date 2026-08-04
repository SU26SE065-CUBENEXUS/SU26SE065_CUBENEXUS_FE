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
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://perfectly-detail-gory.ngrok-free.dev';
    const aiScannerUrl = process.env.NEXT_PUBLIC_AI_SCANNER_BASE_URL || 'https://robena-nonapparitional-knox.ngrok-free.dev';
    return [
      {
        source: '/api/ai-service/:path*',
        destination: `${aiScannerUrl}/:path*`,
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
