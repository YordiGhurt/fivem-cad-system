import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCaseFilePDF } from '@/lib/pdf/generateCaseFile';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const caseFile = await prisma.caseFile.findUnique({
    where: { id },
    include: { createdBy: true, assignedTo: true },
  });

  if (!caseFile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const pdfUrl = await generateCaseFilePDF(caseFile);
    await prisma.caseFile.update({ where: { id }, data: { pdfUrl } });
    return NextResponse.json({ data: { pdfUrl } });
  } catch (error) {
    console.error('[case-files/:id/pdf POST]', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
