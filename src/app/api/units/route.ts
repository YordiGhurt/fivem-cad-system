import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  callsign: z.string().min(1),
  userId: z.string(),
  organizationId: z.string(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const orgId = searchParams.get('organizationId');

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (orgId) where.organizationId = orgId;

  const units = await prisma.unit.findMany({
    where,
    include: { user: true, organization: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: units });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const unit = await prisma.unit.create({
      data,
      include: { user: true, organization: true },
    });

    return NextResponse.json({ data: unit }, { status: 201 });
  } catch (error) {
    console.error('[units POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
