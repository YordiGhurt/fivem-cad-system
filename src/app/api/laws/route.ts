import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  code: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['CRIMINAL', 'CIVIL', 'TRAFFIC', 'ADMINISTRATIVE']),
  penalty: z.string().optional(),
  fineAmount: z.number().optional(),
  jailTime: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [laws, total] = await Promise.all([
    prisma.law.findMany({
      where,
      include: { createdBy: { select: { id: true, username: true } } },
      orderBy: { code: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.law.count({ where }),
  ]);

  return NextResponse.json({ data: laws, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const law = await prisma.law.create({
      data: { ...data, createdById: session.user.id },
      include: { createdBy: { select: { id: true, username: true } } },
    });

    return NextResponse.json({ data: law }, { status: 201 });
  } catch (error) {
    console.error('[laws POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
