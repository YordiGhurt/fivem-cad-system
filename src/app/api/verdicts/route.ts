import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  citizenName: z.string().min(1),
  citizenId: z.string().optional(),
  type: z.enum(['GUILTY', 'NOT_GUILTY', 'PLEA_DEAL', 'DISMISSED']),
  sentence: z.string().optional(),
  jailTime: z.number().int().optional(),
  fineAmount: z.number().optional(),
  caseFileId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { citizenName: { contains: search, mode: 'insensitive' } },
      { caseNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [verdicts, total] = await Promise.all([
    prisma.verdict.findMany({
      where,
      include: { judge: { select: { id: true, username: true } } },
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.verdict.count({ where }),
  ]);

  return NextResponse.json({ data: verdicts, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const caseNumber = `VRD-${Date.now()}`;

    const verdict = await prisma.verdict.create({
      data: { ...data, caseNumber, judgeId: session.user.id },
      include: { judge: { select: { id: true, username: true } } },
    });

    return NextResponse.json({ data: verdict }, { status: 201 });
  } catch (error) {
    console.error('[verdicts POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
