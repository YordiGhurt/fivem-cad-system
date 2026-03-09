import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'CLOSED', 'ARCHIVED']).optional(),
  citizenName: z.string().optional(),
  citizenId: z.string().optional(),
  assignedToId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const caseFile = await prisma.caseFile.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, username: true } },
      assignedTo: { select: { id: true, username: true } },
      charges: { include: { law: { select: { id: true, code: true, title: true } } } },
      verdicts: { include: { judge: { select: { id: true, username: true } } } },
      documents: { include: { author: { select: { id: true, username: true } } } },
    },
  });
  if (!caseFile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: caseFile });
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

    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'CLOSED' || data.status === 'ARCHIVED') {
      updateData.closedAt = new Date();
    }

    const caseFile = await prisma.caseFile.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: { select: { id: true, username: true } },
        assignedTo: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json({ data: caseFile });
  } catch (error) {
    console.error('[case-files/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE() {
  return NextResponse.json({ error: 'Parteiakten können nicht gelöscht werden' }, { status: 405 });
}
