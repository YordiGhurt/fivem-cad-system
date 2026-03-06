import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { ReportDetailClient } from './ReportDetailClient';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getServerSession(authOptions);

  const { id } = await params;
  const report = await prisma.report.findUnique({
    where: { id },
    include: { author: true, incident: true },
  });

  if (!report) notFound();

  return <ReportDetailClient report={report} />;
}
