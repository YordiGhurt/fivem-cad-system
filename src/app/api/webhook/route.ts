import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { emitter } from '@/lib/sse';
import { checkRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

function verifyWebhookKey(req: NextRequest): boolean {
  const key = req.headers.get('x-webhook-key');
  return !!process.env.WEBHOOK_API_KEY && key === process.env.WEBHOOK_API_KEY;
}

const schema = z.object({
  event: z.enum(['incident.create', 'unit.status', 'panic']),
  data: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Allow authenticated dashboard users OR webhook key
  const session = await getServerSession(authOptions);
  if (!session && !verifyWebhookKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { event, data } = schema.parse(body);

    if (event === 'incident.create') {
      const caseNumber = `WH-${Date.now()}`;
      const incident = await prisma.incident.create({
        data: {
          caseNumber,
          type: String(data.type ?? 'Webhook-Einsatz'),
          description: String(data.description ?? ''),
          location: String(data.location ?? 'Unbekannt'),
          priority: Number(data.priority ?? 3),
          status: 'ACTIVE',
          organizationId: String(data.organizationId ?? ''),
          createdById: session?.user?.id ?? String(data.createdById ?? ''),
        },
      });
      emitter.emit('update', { type: 'incident', action: 'created', id: incident.id });
    } else if (event === 'unit.status') {
      const unitId = String(data.unitId ?? '');
      const status = String(data.status ?? 'OFFDUTY');
      await prisma.unit.update({ where: { id: unitId }, data: { status: status as never } });
      emitter.emit('update', { type: 'unit', action: 'status_changed', id: unitId });
    } else if (event === 'panic') {
      const caseNumber = `PANIC-WH-${Date.now()}`;
      const orgId = String(data.organizationId ?? '');
      const userId = session?.user?.id ?? String(data.createdById ?? '');
      await prisma.incident.create({
        data: {
          caseNumber,
          type: 'PANIC',
          description: `🚨 PANIC via Webhook – ${String(data.description ?? '')}`,
          location: String(data.location ?? 'Unbekannt'),
          priority: 1,
          status: 'ACTIVE',
          organizationId: orgId,
          createdById: userId,
        },
      });
      emitter.emit('update', { type: 'incident', action: 'created' });
    }

    return NextResponse.json({ processed: true });
  } catch (error) {
    console.error('[webhook POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
