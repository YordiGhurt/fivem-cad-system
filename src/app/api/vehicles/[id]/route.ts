import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z
  .object({
    model: z.string().optional(),
    color: z.string().optional(),
    stolen: z.boolean().optional(),
    flagged: z.boolean().optional(),
    flagReason: z.string().nullable().optional(),
    registrationExpiry: z.string().nullable().optional(),
  })
  .partial();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { owner: true },
  });

  if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: vehicle });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR' && role !== 'OFFICER')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        registrationExpiry:
          data.registrationExpiry === null
            ? null
            : data.registrationExpiry
              ? new Date(data.registrationExpiry)
              : undefined,
      },
      include: { owner: true },
    });

    return NextResponse.json({ data: vehicle });
  } catch (error) {
    console.error('[vehicles/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Fahrzeuge können nicht gelöscht werden' }, { status: 405 });
}
