import type { NextConfig } from "next";

function sanitizeUrl(url?: string, fallback = ""): string {
  if (!url) return fallback;
  let cleaned = url.trim().replace(/^["']|["']$/g, "");
  if (!cleaned) return fallback;
  if (!cleaned.startsWith("http://") && !cleaned.startsWith("https://") && !cleaned.startsWith("/")) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, "");
}

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
    const rawBackendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    const backendUrl = sanitizeUrl(rawBackendUrl, 'https://perfectly-detail-gory.ngrok-free.dev').replace(/\/api$/, '');
    const aiScannerUrl = sanitizeUrl(process.env.NEXT_PUBLIC_AI_SCANNER_BASE_URL, 'https://cubenexus-rubik-ai-production.up.railway.app');

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
