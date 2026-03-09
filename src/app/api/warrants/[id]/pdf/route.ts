import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateWarrantPDF } from '@/lib/pdf/generateWarrant';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const warrant = await prisma.warrant.findUnique({
    where: { id },
    include: { issuedBy: true },
  });

  if (!warrant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const pdfUrl = await generateWarrantPDF(warrant);
    await prisma.warrant.update({ where: { id }, data: { pdfUrl } });
    return NextResponse.json({ data: { pdfUrl } });
  } catch (error) {
    console.error('[warrants/:id/pdf POST]', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
