import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { DeathCertificateDetailClient } from './DeathCertificateDetailClient';

export default async function DeathCertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';
  const { id } = await params;

  const cert = await prisma.deathCertificate.findUnique({
    where: { id },
    include: { doctor: true, organization: true },
  });

  if (!cert) notFound();

  return <DeathCertificateDetailClient cert={cert} isAdmin={isAdmin} />;
}
