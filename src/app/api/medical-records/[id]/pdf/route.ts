import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateMedicalRecordPDF } from '@/lib/pdf/generateMedicalRecord';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: { author: true, organization: true },
  });

  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const pdfUrl = await generateMedicalRecordPDF(record);
    await prisma.medicalRecord.update({ where: { id }, data: { pdfUrl } });
    return NextResponse.json({ data: { pdfUrl } });
  } catch (error) {
    console.error('[medical-records/:id/pdf POST]', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
