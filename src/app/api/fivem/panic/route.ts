import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyOrganizationMembers } from '@/lib/createNotification';
import { z } from 'zod';

function verifyApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key');
  return key === process.env.FIVEM_API_KEY;
}

const schema = z.object({
  steamId: z.string().min(1),
  unitCallsign: z.string().min(1),
  location: z.string().optional(),
  organizationId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { steamId, unitCallsign, location, organizationId } = schema.parse(body);

    // Find user by steamId to get organizationId
    const user = await prisma.user.findFirst({
      where: { steamId },
      select: { organizationId: true },
    });

    const orgId = organizationId ?? user?.organizationId;

    // Create panic incident
    const caseNumber = `PANIC-${Date.now()}`;
    await prisma.incident.create({
      data: {
        caseNumber,
        type: 'PANIC',
        description: `🚨 PANIC BUTTON – Officer ${unitCallsign} braucht sofortige Hilfe!`,
        location: location ?? 'Unbekannt',
        priority: 1,
        status: 'ACTIVE',
        organizationId: orgId ?? '',
        createdById: (await prisma.user.findFirst({ where: { steamId }, select: { id: true } }))?.id ?? '',
      },
    });

    // Notify all DISPATCHER/OFFICER/SUPERVISOR/ADMIN in the organization
    if (orgId) {
      await notifyOrganizationMembers(
        orgId,
        ['ADMIN', 'SUPERVISOR', 'DISPATCHER', 'OFFICER'],
        '🚨 PANIC BUTTON',
        `Officer ${unitCallsign} braucht sofortige Hilfe! Standort: ${location ?? 'Unbekannt'}`,
        'error',
        '/dashboard/incidents',
      );
    }

    return NextResponse.json({ message: 'Panic alert sent' });
  } catch (error) {
    console.error('[fivem/panic POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
