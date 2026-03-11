import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const transferSchema = z.object({
  targetOrganizationId: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR' && role !== 'OFFICER')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { targetOrganizationId } = transferSchema.parse(body);

    const caseFile = await prisma.caseFile.findUnique({ where: { id } });
    if (!caseFile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (caseFile.transferredToOrgId) {
      return NextResponse.json({ error: 'Akte wurde bereits weitergeleitet' }, { status: 400 });
    }

    const targetOrg = await prisma.organization.findUnique({
      where: { id: targetOrganizationId },
      include: { users: { select: { id: true } } },
    });
    if (!targetOrg) return NextResponse.json({ error: 'Ziel-Organisation nicht gefunden' }, { status: 404 });

    const updated = await prisma.caseFile.update({
      where: { id },
      data: {
        transferredToOrgId: targetOrganizationId,
        transferredAt: new Date(),
        status: 'UNDER_REVIEW',
      },
    });

    // Benachrichtigung an Mitglieder der Ziel-Organisation senden
    if (targetOrg.users.length > 0) {
      await prisma.notification.createMany({
        data: targetOrg.users.map((u) => ({
          userId: u.id,
          title: 'Neue Akte eingegangen',
          message: `Parteiakte "${caseFile.title}" (${caseFile.caseNumber}) wurde an Ihre Organisation weitergeleitet.`,
          type: 'case_transfer',
          link: `/dashboard/case-files/${id}`,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('[case-files/:id/transfer POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
