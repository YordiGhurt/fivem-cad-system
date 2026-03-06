import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const statusSchema = z.object({
  unitId: z.string(),
  status: z.enum(['AVAILABLE', 'BUSY', 'OFFDUTY', 'ONSCENE', 'ENROUTE', 'BREAK']),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { unitId, status } = statusSchema.parse(body);

    const unit = await prisma.unit.update({
      where: { id: unitId },
      data: { status },
      include: { user: true, organization: true },
    });

    return NextResponse.json({ data: unit });
  } catch (error) {
    console.error('[units/status POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
