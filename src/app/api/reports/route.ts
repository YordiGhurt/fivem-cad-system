import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['INCIDENT', 'ARREST', 'WARRANT', 'MEDICAL', 'CUSTOM']),
  incidentId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      include: { author: true, incident: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count(),
  ]);

  return NextResponse.json({
    data: reports,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const report = await prisma.report.create({
      data: { ...data, authorId: session.user.id },
      include: { author: true, incident: true },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error('[reports POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
