import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVerdictPDF } from '@/lib/pdf/generateVerdict';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const verdict = await prisma.verdict.findUnique({
    where: { id },
    include: { judge: true },
  });

  if (!verdict) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const pdfUrl = await generateVerdictPDF(verdict);
    await prisma.verdict.update({ where: { id }, data: { pdfUrl } });
    return NextResponse.json({ data: { pdfUrl } });
  } catch (error) {
    console.error('[verdicts/:id/pdf POST]', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
