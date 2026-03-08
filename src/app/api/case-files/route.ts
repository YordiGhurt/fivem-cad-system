import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'CLOSED', 'ARCHIVED']).optional(),
  citizenName: z.string().optional(),
  citizenId: z.string().optional(),
  assignedToId: z.string().optional(),
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
      { title: { contains: search, mode: 'insensitive' } },
      { caseNumber: { contains: search, mode: 'insensitive' } },
      { citizenName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [caseFiles, total] = await Promise.all([
    prisma.caseFile.findMany({
      where,
      include: {
        createdBy: { select: { id: true, username: true } },
        assignedTo: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.caseFile.count({ where }),
  ]);

  return NextResponse.json({ data: caseFiles, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const caseNumber = `CF-${Date.now()}`;

    const caseFile = await prisma.caseFile.create({
      data: { ...data, caseNumber, createdById: session.user.id },
      include: {
        createdBy: { select: { id: true, username: true } },
        assignedTo: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json({ data: caseFile }, { status: 201 });
  } catch (error) {
    console.error('[case-files POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
