import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  type: z.enum(['GUILTY', 'NOT_GUILTY', 'PLEA_DEAL', 'DISMISSED']).optional(),
  sentence: z.string().optional(),
  jailTime: z.number().int().optional(),
  fineAmount: z.number().optional(),
  caseFileId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const verdict = await prisma.verdict.findUnique({
    where: { id },
    include: {
      judge: { select: { id: true, username: true } },
      charges: true,
      caseFile: { select: { id: true, caseNumber: true, title: true } },
    },
  });
  if (!verdict) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: verdict });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const verdict = await prisma.verdict.update({
      where: { id },
      data,
      include: { judge: { select: { id: true, username: true } } },
    });

    return NextResponse.json({ data: verdict });
  } catch (error) {
    console.error('[verdicts/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
