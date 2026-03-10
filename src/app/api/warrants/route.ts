import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkOrgPermission } from '@/lib/checkOrgPermission';
import { z } from 'zod';

const createSchema = z.object({
  citizenName: z.string().min(1),
  citizenId: z.string().optional(),
  reason: z.string().min(1),
  charges: z.string().min(1),
  expiresAt: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where = status ? { status: status as 'ACTIVE' | 'EXPIRED' | 'SERVED' } : {};

  const [warrants, total] = await Promise.all([
    prisma.warrant.findMany({
      where,
      include: { issuedBy: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.warrant.count({ where }),
  ]);

  return NextResponse.json({
    data: warrants,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await checkOrgPermission(session.user.id, 'canCreateWarrants');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const warrant = await prisma.warrant.create({
      data: {
        ...data,
        issuedById: session.user.id,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: { issuedBy: true },
    });

    return NextResponse.json({ data: warrant }, { status: 201 });
  } catch (error) {
    console.error('[warrants POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
