import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  offense: z.string().min(1),
  category: z.string().min(1),
  legalSection: z.string().min(1),
  fineMin: z.number().int().min(0).optional().default(0),
  fineMax: z.number().int().min(0).optional().default(0),
  jailMin: z.number().int().min(0).optional().default(0),
  jailMax: z.number().int().min(0).optional().default(0),
  seizure: z.string().optional(),
  additionalInfo: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');
  const activeOnly = searchParams.get('active');

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (activeOnly === 'true') where.active = true;
  if (search) {
    where.OR = [
      { offense: { contains: search, mode: 'insensitive' } },
      { legalSection: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.fineEntry.findMany({
      where,
      orderBy: [{ category: 'asc' }, { offense: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.fineEntry.count({ where }),
  ]);

  return NextResponse.json({ data: entries, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const entry = await prisma.fineEntry.create({ data });
    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('[fine-catalog POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
