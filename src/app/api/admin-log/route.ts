import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AdminLogAction } from '@prisma/client';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '50');
  const action = searchParams.get('action') as AdminLogAction | null;
  const search = searchParams.get('search') ?? '';

  const where: Record<string, unknown> = {};
  if (action && Object.values(AdminLogAction).includes(action)) {
    where.action = action;
  }
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: { performedBy: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminLog.count({ where }),
  ]);

  return NextResponse.json({ data: logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
