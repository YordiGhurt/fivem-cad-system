import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  fileUrl: z.string().url().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const documents = await prisma.caseDocument.findMany({
    where: { caseFileId: id },
    include: { author: { select: { id: true, username: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: documents });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = createSchema.parse(body);

    const document = await prisma.caseDocument.create({
      data: { ...data, caseFileId: id, authorId: session.user.id },
      include: { author: { select: { id: true, username: true } } },
    });

    return NextResponse.json({ data: document }, { status: 201 });
  } catch (error) {
    console.error('[case-files/:id/documents POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
