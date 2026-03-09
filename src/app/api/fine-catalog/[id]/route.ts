import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  offense: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  legalSection: z.string().min(1).optional(),
  fineMin: z.number().int().min(0).optional(),
  fineMax: z.number().int().min(0).optional(),
  jailMin: z.number().int().min(0).optional(),
  jailMax: z.number().int().min(0).optional(),
  seizure: z.string().optional(),
  additionalInfo: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.fineEntry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: entry });
}

export async function PUT() {
  return NextResponse.json({ error: 'Bußgeldkatalog-Einträge können nicht bearbeitet werden – deaktivieren und neu erstellen' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Bußgeldkatalog-Einträge können nicht gelöscht werden' }, { status: 405 });
}
