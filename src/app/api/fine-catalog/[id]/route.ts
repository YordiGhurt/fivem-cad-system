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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);

    const entry = await prisma.fineEntry.update({ where: { id }, data });
    return NextResponse.json({ data: entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    console.error('[fine-catalog/:id PUT]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await prisma.fineEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[fine-catalog/:id DELETE]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
