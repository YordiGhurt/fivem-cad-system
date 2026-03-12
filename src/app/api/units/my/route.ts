import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const unit = await prisma.unit.findFirst({
    where: { userId: session.user.id },
    include: { user: true, organization: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: unit ?? null });
}
