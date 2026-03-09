import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  severity: z.enum(['MINOR', 'MAJOR', 'FINAL']).optional(),
  resolved: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const warning = await prisma.orgWarning.findUnique({
    where: { id },
    include: {
      targetUser: { select: { id: true, username: true } },
      issuedBy: { select: { id: true, username: true } },
      organization: { select: { id: true, name: true, callsign: true } },
    },
  });

  if (!warning) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: warning });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const warning = await prisma.orgWarning.update({
      where: { id },
      data,
      include: {
        targetUser: { select: { id: true, username: true } },
        issuedBy: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
    });

    return NextResponse.json({ data: warning });
  } catch (error) {
    console.error('[org-warnings/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  await prisma.orgWarning.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
