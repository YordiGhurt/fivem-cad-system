import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const bodySchema = z.object({ unitId: z.string().min(1) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { unitId } = bodySchema.parse(body);

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const existing = await prisma.incidentUnit.findUnique({
      where: { incidentId_unitId: { incidentId: id, unitId } },
    });
    if (existing) {
      return NextResponse.json({ error: 'Einheit bereits zugewiesen' }, { status: 409 });
    }

    const incidentUnit = await prisma.incidentUnit.create({
      data: { incidentId: id, unitId },
      include: {
        unit: { include: { user: true, organization: true } },
      },
    });

    return NextResponse.json({ data: incidentUnit }, { status: 201 });
  } catch (error) {
    console.error('[incidents/:id/units POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { unitId } = bodySchema.parse(body);

    await prisma.incidentUnit.delete({
      where: { incidentId_unitId: { incidentId: id, unitId } },
    });

    return NextResponse.json({ message: 'Removed' });
  } catch (error) {
    console.error('[incidents/:id/units DELETE]', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
