import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  organizationId: z.string().min(1),
  shiftStart: z.string().min(1),
  shiftEnd: z.string().optional(),
  callsHandled: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;

  const [logs, total] = await Promise.all([
    prisma.dispatchLog.findMany({
      where,
      include: {
        dispatcher: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dispatchLog.count({ where }),
  ]);

  return NextResponse.json({ data: logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const logNumber = `DL-${Date.now()}`;

    const log = await prisma.dispatchLog.create({
      data: {
        logNumber,
        dispatcherId: session.user.id,
        organizationId: data.organizationId,
        shiftStart: new Date(data.shiftStart),
        shiftEnd: data.shiftEnd ? new Date(data.shiftEnd) : undefined,
        callsHandled: data.callsHandled ?? 0,
        notes: data.notes,
      },
      include: {
        dispatcher: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
    });

    return NextResponse.json({ data: log }, { status: 201 });
  } catch (error) {
    console.error('[dispatch-logs POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
