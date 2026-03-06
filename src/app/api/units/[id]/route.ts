import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z
  .object({
    callsign: z.string().optional(),
    status: z.enum(['AVAILABLE', 'BUSY', 'OFFDUTY', 'ONSCENE', 'ENROUTE', 'BREAK']).optional(),
    position: z.object({ lat: z.number(), lng: z.number() }).optional(),
    activeCallId: z.string().nullable().optional(),
  })
  .partial();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const unit = await prisma.unit.findUnique({
    where: { id },
    include: { user: true, organization: true },
  });

  if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: unit });
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

    const unit = await prisma.unit.update({
      where: { id },
      data,
      include: { user: true, organization: true },
    });

    return NextResponse.json({ data: unit });
  } catch (error) {
    console.error('[units/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[units/:id DELETE]', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
