import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { WarrantDetailClient } from './WarrantDetailClient';

export default async function WarrantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';
  const { id } = await params;

  const warrant = await prisma.warrant.findUnique({
    where: { id },
    include: { issuedBy: true },
  });

  if (!warrant) notFound();

  return <WarrantDetailClient warrant={warrant} isAdmin={isAdmin} />;
}
