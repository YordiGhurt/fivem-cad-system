import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z
  .object({
    type: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['ACTIVE', 'PENDING', 'CLOSED', 'CANCELLED']).optional(),
    priority: z.number().min(1).max(5).optional(),
  })
  .partial();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      organization: true,
      units: { include: { unit: { include: { user: true, organization: true } } } },
      notes: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      reports: { include: { author: true } },
    },
  });

  if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: incident });
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
    const data = updateSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'CLOSED' || data.status === 'CANCELLED') {
      updateData.closedAt = new Date();
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: { organization: true },
    });

    return NextResponse.json({ data: incident });
  } catch (error) {
    console.error('[incidents/:id PUT]', error);
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

  try {
    const { id } = await params;
    await prisma.incident.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[incidents/:id DELETE]', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
