import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:5212/api/:path*',
      },
      {
        source: '/hubs/:path*',
        destination: 'http://127.0.0.1:5212/hubs/:path*',
      },
    ];
  },
};

export default nextConfig;
