import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const permissionsSchema = z.object({
  permissions: z.record(z.boolean()).optional(),
  name: z.string().optional(),
  level: z.number().int().optional(),
  color: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rankId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, rankId } = await params;
  const rank = await prisma.orgRank.findUnique({
    where: { id: rankId, organizationId: id },
  });
  if (!rank) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: rank });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rankId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id, rankId } = await params;
    const body = await req.json();
    const data = permissionsSchema.parse(body);

    const rank = await prisma.orgRank.update({
      where: { id: rankId, organizationId: id },
      data,
    });
    return NextResponse.json({ data: rank });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('[organizations/:id/ranks/:rankId PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; rankId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id, rankId } = await params;
    await prisma.orgRank.delete({
      where: { id: rankId, organizationId: id },
    });
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[organizations/:id/ranks/:rankId DELETE]', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
