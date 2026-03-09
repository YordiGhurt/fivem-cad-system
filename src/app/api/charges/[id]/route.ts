import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdminLog } from '@/lib/adminLog';
import { z } from 'zod';

const updateSchema = z.object({
  description: z.string().min(1).optional(),
  status: z.enum(['PENDING', 'ACTIVE', 'DISMISSED', 'SERVED']).optional(),
  lawId: z.string().optional(),
  verdictId: z.string().optional(),
  caseFileId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const charge = await prisma.charge.findUnique({
    where: { id },
    include: {
      issuedBy: { select: { id: true, username: true } },
      law: { select: { id: true, code: true, title: true } },
      verdict: { select: { id: true, caseNumber: true, type: true } },
    },
  });
  if (!charge) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: charge });
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

    const charge = await prisma.charge.update({
      where: { id },
      data,
      include: {
        issuedBy: { select: { id: true, username: true } },
        law: { select: { id: true, code: true, title: true } },
      },
    });

    return NextResponse.json({ data: charge });
  } catch (error) {
    console.error('[charges/:id PUT]', error);
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
    await prisma.charge.delete({ where: { id } });
    await createAdminLog('DATA_DELETED', `Anklage ${id} gelöscht`, session.user.id, id, 'Charge');
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[charges/:id DELETE]', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
