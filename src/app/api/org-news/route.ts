import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  pinned: z.boolean().optional(),
  organizationId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;

  const [news, total] = await Promise.all([
    prisma.orgNews.findMany({
      where,
      include: {
        author: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.orgNews.count({ where }),
  ]);

  return NextResponse.json({ data: news, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const news = await prisma.orgNews.create({
      data: { ...data, authorId: session.user.id },
      include: {
        author: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
    });

    return NextResponse.json({ data: news }, { status: 201 });
  } catch (error) {
    console.error('[org-news POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
