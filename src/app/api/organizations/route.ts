import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['POLICE', 'FIRE', 'AMBULANCE', 'DOJ', 'CUSTOM']),
  callsign: z.string().min(1),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  description: z.string().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orgs = await prisma.organization.findMany({
    include: { _count: { select: { units: true, users: true } } },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ data: orgs });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const org = await prisma.organization.create({ data });
    return NextResponse.json({ data: org }, { status: 201 });
  } catch (error) {
    console.error('[organizations POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
