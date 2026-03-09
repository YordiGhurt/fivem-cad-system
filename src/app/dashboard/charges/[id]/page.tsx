import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { ChargeDetailClient } from './ChargeDetailClient';

export default async function ChargeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getServerSession(authOptions);
  const { id } = await params;

  const charge = await prisma.charge.findUnique({
    where: { id },
    include: { issuedBy: true, law: true, caseFile: true },
  });

  if (!charge) notFound();

  return <ChargeDetailClient charge={charge} />;
}
