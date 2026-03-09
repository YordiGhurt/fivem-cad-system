import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  shiftEnd: z.string().optional(),
  callsHandled: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const log = await prisma.dispatchLog.findUnique({
    where: { id },
    include: {
      dispatcher: { select: { id: true, username: true } },
      organization: { select: { id: true, name: true, callsign: true } },
    },
  });

  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: log });
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
    const { shiftEnd, ...rest } = updateSchema.parse(body);

    const log = await prisma.dispatchLog.update({
      where: { id },
      data: {
        ...rest,
        ...(shiftEnd ? { shiftEnd: new Date(shiftEnd) } : {}),
      },
      include: {
        dispatcher: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
    });

    return NextResponse.json({ data: log });
  } catch (error) {
    console.error('[dispatch-logs/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.dispatchLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
