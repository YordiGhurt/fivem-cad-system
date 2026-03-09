import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateChargePDF } from '@/lib/pdf/generateCharge';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const charge = await prisma.charge.findUnique({
    where: { id },
    include: { issuedBy: true, law: true },
  });

  if (!charge) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  try {
    const pdfUrl = await generateChargePDF(charge);
    await prisma.charge.update({ where: { id }, data: { pdfUrl } });
    return NextResponse.json({ data: { pdfUrl } });
  } catch (error) {
    console.error('[charges/:id/pdf POST]', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
