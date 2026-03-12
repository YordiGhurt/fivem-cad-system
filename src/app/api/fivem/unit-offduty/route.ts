import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitter } from '@/lib/sse';

function verifyApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.FIVEM_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { citizenId } = body as { citizenId?: string };

    if (!citizenId) {
      return NextResponse.json({ error: 'citizenId required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { citizenId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.unit.updateMany({
      where: { userId: user.id, status: { not: 'OFFDUTY' } },
      data: { status: 'OFFDUTY' },
    });

    emitter.emit('update', { type: 'unit', action: 'status_changed' });

    return NextResponse.json({ message: 'Units set to OFFDUTY' });
  } catch (error) {
    console.error('[fivem/unit-offduty POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
