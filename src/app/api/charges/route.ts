import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  citizenName: z.string().min(1),
  citizenId: z.string().optional(),
  lawId: z.string().optional(),
  description: z.string().min(1),
  status: z.enum(['PENDING', 'ACTIVE', 'DISMISSED', 'SERVED']).optional(),
  caseFileId: z.string().optional(),
  incidentId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { citizenName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [charges, total] = await Promise.all([
    prisma.charge.findMany({
      where,
      include: {
        issuedBy: { select: { id: true, username: true } },
        law: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.charge.count({ where }),
  ]);

  return NextResponse.json({ data: charges, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const charge = await prisma.charge.create({
      data: { ...data, issuedById: session.user.id },
      include: {
        issuedBy: { select: { id: true, username: true } },
        law: { select: { id: true, code: true, title: true } },
      },
    });

    return NextResponse.json({ data: charge }, { status: 201 });
  } catch (error) {
    console.error('[charges POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
