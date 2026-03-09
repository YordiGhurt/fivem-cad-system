import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAdminLog } from '@/lib/adminLog';

const updateSchema = z
  .object({
    name: z.string().optional(),
    callsign: z.string().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
    active: z.boolean().optional(),
  })
  .partial();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      units: { include: { user: true } },
      _count: { select: { users: true } },
    },
  });

  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: org });
}

export async function PUT(
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
    const data = updateSchema.parse(body);

    const org = await prisma.organization.update({ where: { id }, data });
    await createAdminLog('ORG_UPDATED', `Organisation "${org.name}" aktualisiert`, session.user.id, id, 'Organization');
    return NextResponse.json({ data: org });
  } catch (error) {
    console.error('[organizations/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const org = await prisma.organization.findUnique({ where: { id } });
    await prisma.organization.delete({ where: { id } });
    await createAdminLog('DATA_DELETED', `Organisation "${org?.name ?? id}" gelöscht`, session.user.id, id, 'Organization');
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[organizations/:id DELETE]', error);
    return NextResponse.json({ error: 'Not found or has dependencies' }, { status: 400 });
  }
}
