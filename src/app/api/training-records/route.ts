import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  traineeName: z.string().min(1),
  traineeId: z.string().optional(),
  trainerName: z.string().min(1),
  trainerId: z.string().optional(),
  organizationId: z.string().min(1),
  type: z.enum(['BASIC', 'ADVANCED', 'SPECIALIST', 'REFRESHER', 'SUPERVISOR', 'CUSTOM']),
  modules: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
  passed: z.boolean().optional(),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (search) {
    where.OR = [
      { traineeName: { contains: search, mode: 'insensitive' } },
      { trainerName: { contains: search, mode: 'insensitive' } },
      { recordNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.trainingRecord.findMany({
      where,
      include: {
        trainee: { select: { id: true, username: true } },
        trainer: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.trainingRecord.count({ where }),
  ]);

  return NextResponse.json({ data: records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const recordNumber = `TR-${Date.now()}`;
    const { date, ...rest } = data;

    const record = await prisma.trainingRecord.create({
      data: {
        ...rest,
        recordNumber,
        date: date ? new Date(date) : new Date(),
      },
      include: {
        trainee: { select: { id: true, username: true } },
        trainer: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error('[training-records POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
