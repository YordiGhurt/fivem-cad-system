import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  deceasedName: z.string().min(1),
  citizenId: z.string().optional(),
  dateOfDeath: z.string(),
  timeOfDeath: z.string().optional(),
  locationOfDeath: z.string().min(1),
  cause: z.enum(['NATURAL', 'ACCIDENT', 'HOMICIDE', 'SUICIDE', 'UNKNOWN']),
  causeDescription: z.string().min(1),
  organizationId: z.string().min(1),
  additionalNotes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { deceasedName: { contains: search, mode: 'insensitive' } },
      { certificateNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [certs, total] = await Promise.all([
    prisma.deathCertificate.findMany({
      where,
      include: {
        doctor: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deathCertificate.count({ where }),
  ]);

  return NextResponse.json({ data: certs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const certificateNumber = `DC-${Date.now()}`;

    const cert = await prisma.deathCertificate.create({
      data: {
        ...data,
        certificateNumber,
        doctorId: session.user.id,
        dateOfDeath: new Date(data.dateOfDeath),
        timeOfDeath: data.timeOfDeath ? new Date(data.timeOfDeath) : undefined,
      },
      include: {
        doctor: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: cert }, { status: 201 });
  } catch (error) {
    console.error('[death-certificates POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
