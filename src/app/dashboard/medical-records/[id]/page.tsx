import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { MedicalRecordDetailClient } from './MedicalRecordDetailClient';

export default async function MedicalRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getServerSession(authOptions);
  const { id } = await params;

  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: { author: true, organization: true },
  });

  if (!record) notFound();

  return <MedicalRecordDetailClient record={record} />;
}
