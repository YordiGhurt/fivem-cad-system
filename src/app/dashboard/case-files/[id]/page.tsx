import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { CaseFileDetailClient } from './CaseFileDetailClient';

export default async function CaseFileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getServerSession(authOptions);
  const { id } = await params;

  const caseFile = await prisma.caseFile.findUnique({
    where: { id },
    include: {
      createdBy: true,
      assignedTo: true,
      charges: { include: { issuedBy: true } },
      verdicts: { include: { judge: true } },
    },
  });

  if (!caseFile) notFound();

  return <CaseFileDetailClient caseFile={caseFile} />;
}
