import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

function verifyApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.FIVEM_API_KEY;
}

const schema = z.object({
  unitId: z.string().min(1),
  caseNumber: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { unitId, caseNumber } = schema.parse(body);

    const incident = await prisma.incident.findUnique({ where: { caseNumber } });
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    if (incident.status === 'CLOSED' || incident.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Incident is already closed or cancelled' }, { status: 400 });
    }

    await prisma.incidentUnit.upsert({
      where: { incidentId_unitId: { incidentId: incident.id, unitId } },
      update: {},
      create: { incidentId: incident.id, unitId },
    });

    return NextResponse.json({ message: 'Unit assigned to incident' });
  } catch (error) {
    console.error('[fivem/assign-unit POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
