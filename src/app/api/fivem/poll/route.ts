import { NextRequest, NextResponse } from 'next/server';
import { drainQueue } from '@/lib/fivemQueue';
import { checkRateLimit } from '@/lib/rateLimit';

function verifyApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.FIVEM_API_KEY;
}

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const events = drainQueue();
  return NextResponse.json({ events });
}
