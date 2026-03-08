import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSchema = z.object({
  diagnosis: z.string().min(1).optional(),
  treatment: z.string().optional(),
  medications: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  confidential: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const record = await prisma.medicalRecord.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true } },
      organization: { select: { id: true, name: true } },
    },
  });
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ data: record });
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

    const record = await prisma.medicalRecord.update({
      where: { id },
      data,
      include: {
        author: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: record });
  } catch (error) {
    console.error('[medical-records/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
