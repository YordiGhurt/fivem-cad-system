import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createRankSchema = z.object({
  name: z.string().min(1),
  level: z.number().int().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const ranks = await prisma.orgRank.findMany({
    where: { organizationId: id },
    orderBy: { level: 'asc' },
  });

  return NextResponse.json({ data: ranks });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = createRankSchema.parse(body);

    const rank = await prisma.orgRank.create({
      data: { organizationId: id, ...data },
    });

    return NextResponse.json({ data: rank }, { status: 201 });
  } catch (error) {
    console.error('[organizations/:id/ranks POST]', error);
    return NextResponse.json({ error: 'Invalid data or duplicate name/level' }, { status: 400 });
  }
}
