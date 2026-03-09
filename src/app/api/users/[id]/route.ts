import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const patchSchema = z
  .object({
    role: z.enum(['ADMIN', 'SUPERVISOR', 'OFFICER', 'DISPATCHER', 'USER']).optional(),
    active: z.boolean().optional(),
    organizationId: z.string().nullable().optional(),
  })
  .partial();

export async function PATCH(
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
    const data = patchSchema.parse(body);

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { organization: true },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('[users/:id PATCH]', error);
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

    // Prevent deleting yourself
    if (session.user.id === id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[users/:id DELETE]', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 400 });
  }
}
