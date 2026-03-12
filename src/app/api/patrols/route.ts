import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

interface Patrol {
  id: string;
  name: string;
  unitIds: string[];
  createdAt: string;
}

// In-memory patrol storage (session-based, ephemeral)
declare global {
  // eslint-disable-next-line no-var
  var __patrols: Map<string, Patrol> | undefined;
}

const patrols: Map<string, Patrol> = globalThis.__patrols ?? new Map();
if (!globalThis.__patrols) {
  globalThis.__patrols = patrols;
}

const createSchema = z.object({
  name: z.string().min(1),
  unitIds: z.array(z.string()).min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  void searchParams;

  const data = Array.from(patrols.values());
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { name, unitIds } = createSchema.parse(body);

    const id = `patrol-${Date.now()}`;
    const patrol: Patrol = { id, name, unitIds, createdAt: new Date().toISOString() };
    patrols.set(id, patrol);

    return NextResponse.json({ data: patrol }, { status: 201 });
  } catch (error) {
    console.error('[patrols POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  patrols.delete(id);
  return NextResponse.json({ message: 'Deleted' });
}
