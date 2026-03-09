import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { VerdictDetailClient } from './VerdictDetailClient';

export default async function VerdictDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';
  const { id } = await params;

  const verdict = await prisma.verdict.findUnique({
    where: { id },
    include: { judge: true, caseFile: true },
  });

  if (!verdict) notFound();

  return <VerdictDetailClient verdict={verdict} isAdmin={isAdmin} />;
}
