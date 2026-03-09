import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdminLog } from '@/lib/adminLog';
import { z } from 'zod';

const updateSchema = z.object({
  type: z.enum(['GUILTY', 'NOT_GUILTY', 'PLEA_DEAL', 'DISMISSED']).optional(),
  sentence: z.string().optional(),
  jailTime: z.number().int().optional(),
  fineAmount: z.number().optional(),
  caseFileId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const verdict = await prisma.verdict.findUnique({
    where: { id },
    include: {
      judge: { select: { id: true, username: true } },
      charges: true,
      caseFile: { select: { id: true, caseNumber: true, title: true } },
    },
  });
  if (!verdict) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: verdict });
}

export async function PUT() {
  return NextResponse.json({ error: 'Urteile können nach der Erstellung nicht bearbeitet werden' }, { status: 405 });
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
    await prisma.verdict.delete({ where: { id } });
    await createAdminLog('DATA_DELETED', `Urteil ${id} gelöscht`, session.user.id, id, 'Verdict');
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[verdicts/:id DELETE]', error);
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
