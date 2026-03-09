import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['CRIMINAL', 'CIVIL', 'TRAFFIC', 'ADMINISTRATIVE']).optional(),
  penalty: z.string().optional(),
  fineAmount: z.number().optional(),
  jailTime: z.number().int().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const law = await prisma.law.findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, username: true } } },
  });
  if (!law) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: law });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const law = await prisma.law.update({
      where: { id },
      data,
      include: { createdBy: { select: { id: true, username: true } } },
    });

    return NextResponse.json({ data: law });
  } catch (error) {
    console.error('[laws/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Gesetze können nicht gelöscht werden – setze active=false zur Deaktivierung' }, { status: 405 });
}
