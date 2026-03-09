import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(['MINOR', 'MAJOR', 'FINAL']).optional(),
  targetUserId: z.string().min(1),
  organizationId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const organizationId = searchParams.get('organizationId') ?? undefined;
  const targetUserId = searchParams.get('targetUserId') ?? undefined;
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (targetUserId) where.targetUserId = targetUserId;

  const [warnings, total] = await Promise.all([
    prisma.orgWarning.findMany({
      where,
      include: {
        targetUser: { select: { id: true, username: true } },
        issuedBy: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.orgWarning.count({ where }),
  ]);

  return NextResponse.json({ data: warnings, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const warning = await prisma.orgWarning.create({
      data: { ...data, issuedById: session.user.id },
      include: {
        targetUser: { select: { id: true, username: true } },
        issuedBy: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
    });

    return NextResponse.json({ data: warning }, { status: 201 });
  } catch (error) {
    console.error('[org-warnings POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
