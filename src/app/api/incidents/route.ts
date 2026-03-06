import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  type: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  status: z.enum(['ACTIVE', 'PENDING', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.number().min(1).max(5).optional(),
  organizationId: z.string(),
});

function generateCaseNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `CAD-${year}-${rand}`;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where = status ? { status: status as 'ACTIVE' | 'PENDING' | 'CLOSED' | 'CANCELLED' } : {};

  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      include: {
        organization: true,
        units: { include: { unit: { include: { user: true } } } },
        _count: { select: { notes: true, reports: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incident.count({ where }),
  ]);

  return NextResponse.json({
    data: incidents,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    let caseNumber = generateCaseNumber();
    while (await prisma.incident.findUnique({ where: { caseNumber } })) {
      caseNumber = generateCaseNumber();
    }

    const incident = await prisma.incident.create({
      data: {
        ...data,
        caseNumber,
        createdById: session.user.id,
      },
      include: { organization: true },
    });

    return NextResponse.json({ data: incident }, { status: 201 });
  } catch (error) {
    console.error('[incidents POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
