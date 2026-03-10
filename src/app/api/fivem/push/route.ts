import { NextRequest, NextResponse } from 'next/server';
import { enqueueEvent } from '@/lib/fivemQueue';
import { checkRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

const schema = z.object({
  type: z.string().min(1),
  payload: z.record(z.unknown()),
});

function verifyApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.FIVEM_API_KEY;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, payload } = schema.parse(body);
    enqueueEvent(type, payload as Record<string, unknown>);
    return NextResponse.json({ message: 'Event queued' });
  } catch (error) {
    console.error('[fivem/push POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
