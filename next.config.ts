import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: ['@prisma/client', 'prisma', 'bcryptjs'],
};

export default nextConfig;
