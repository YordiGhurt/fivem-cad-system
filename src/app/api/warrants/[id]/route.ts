import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdminLog } from '@/lib/adminLog';
import { z } from 'zod';

const updateSchema = z
  .object({
    status: z.enum(['ACTIVE', 'EXPIRED', 'SERVED']).optional(),
    reason: z.string().optional(),
    charges: z.string().optional(),
    expiresAt: z.string().nullable().optional(),
  })
  .partial();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const warrant = await prisma.warrant.findUnique({
    where: { id },
    include: { issuedBy: true },
  });

  if (!warrant) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: warrant });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const warrant = await prisma.warrant.update({
      where: { id },
      data: {
        ...data,
        expiresAt:
          data.expiresAt === null
            ? null
            : data.expiresAt
              ? new Date(data.expiresAt)
              : undefined,
      },
      include: { issuedBy: true },
    });

    return NextResponse.json({ data: warrant });
  } catch (error) {
    console.error('[warrants/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    await prisma.warrant.delete({ where: { id } });
    await createAdminLog('DATA_DELETED', `Haftbefehl ${id} gelöscht`, session.user.id, id, 'Warrant');
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[warrants/:id DELETE]', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
