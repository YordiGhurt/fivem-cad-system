import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
  allowedDevOrigins: ['https://cad.bigone1.net'],
};

export default nextConfig;
