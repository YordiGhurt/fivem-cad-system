import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

function verifyApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.FIVEM_API_KEY;
}

interface GpsUnit {
  citizenId: string;
  x: number;
  y: number;
  z: number;
}

// In-memory GPS positions map (ephemeral, session-based)
declare global {
  // eslint-disable-next-line no-var
  var __gpsPositions: Map<string, GpsUnit & { updatedAt: number }> | undefined;
}

const gpsMap: Map<string, GpsUnit & { updatedAt: number }> =
  globalThis.__gpsPositions ?? new Map();
if (!globalThis.__gpsPositions) {
  globalThis.__gpsPositions = gpsMap;
}

const schema = z.object({
  units: z.array(
    z.object({
      citizenId: z.string().min(1),
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { units } = schema.parse(body);

    const now = Date.now();
    for (const unit of units) {
      gpsMap.set(unit.citizenId, { ...unit, updatedAt: now });
    }

    return NextResponse.json({ message: 'GPS positions updated', count: units.length });
  } catch (error) {
    console.error('[fivem/gps POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  // Allow authenticated dashboard users via session, or API key for server-to-server calls
  const apiKey = req.headers.get('x-api-key');
  const isApiKey = !!apiKey && apiKey === process.env.FIVEM_API_KEY;

  if (!isApiKey) {
    const { getServerSession } = await import('next-auth');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // Remove stale entries (older than 30 seconds) before returning
  const staleThreshold = Date.now() - 30_000;
  for (const [key, val] of gpsMap) {
    if (val.updatedAt < staleThreshold) gpsMap.delete(key);
  }

  const positions = Array.from(gpsMap.values());
  return NextResponse.json({ data: positions });
}
