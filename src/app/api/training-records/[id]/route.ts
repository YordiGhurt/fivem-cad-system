import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdminLog } from '@/lib/adminLog';
import { z } from 'zod';

const updateSchema = z.object({
  traineeName: z.string().min(1).optional(),
  trainerName: z.string().min(1).optional(),
  type: z.enum(['BASIC', 'ADVANCED', 'SPECIALIST', 'REFRESHER', 'SUPERVISOR', 'CUSTOM']).optional(),
  modules: z.record(z.boolean()).optional(),
  notes: z.string().optional(),
  passed: z.boolean().optional(),
  date: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const record = await prisma.trainingRecord.findUnique({
    where: { id },
    include: {
      trainee: { select: { id: true, username: true } },
      trainer: { select: { id: true, username: true } },
      organization: { select: { id: true, name: true, callsign: true } },
    },
  });

  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: record });
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
    const { date, ...rest } = updateSchema.parse(body);

    const record = await prisma.trainingRecord.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
      },
      include: {
        trainee: { select: { id: true, username: true } },
        trainer: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error('[training-records/:id PUT]', error);
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
  await prisma.trainingRecord.delete({ where: { id } });
  await createAdminLog('DATA_DELETED', `Ausbildungsakte ${id} gelöscht`, session.user.id, id, 'TrainingRecord');
  return NextResponse.json({ success: true });
}
