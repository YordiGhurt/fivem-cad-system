import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  deceasedName: z.string().min(1).optional(),
  locationOfDeath: z.string().min(1).optional(),
  cause: z.enum(['NATURAL', 'ACCIDENT', 'HOMICIDE', 'SUICIDE', 'UNKNOWN']).optional(),
  causeDescription: z.string().min(1).optional(),
  additionalNotes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const cert = await prisma.deathCertificate.findUnique({
    where: { id },
    include: {
      doctor: { select: { id: true, username: true } },
      organization: { select: { id: true, name: true } },
    },
  });
  if (!cert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: cert });
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

    const cert = await prisma.deathCertificate.update({
      where: { id },
      data,
      include: {
        doctor: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: cert });
  } catch (error) {
    console.error('[death-certificates/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
