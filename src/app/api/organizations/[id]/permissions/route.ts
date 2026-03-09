import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAdminLog } from '@/lib/adminLog';

const permissionsSchema = z.object({
  canViewIncidents: z.boolean().optional(),
  canCreateIncidents: z.boolean().optional(),
  canViewWarrants: z.boolean().optional(),
  canCreateWarrants: z.boolean().optional(),
  canViewReports: z.boolean().optional(),
  canCreateReports: z.boolean().optional(),
  canViewCitizens: z.boolean().optional(),
  canViewVehicles: z.boolean().optional(),
  canManageUnits: z.boolean().optional(),
  canViewLaws: z.boolean().optional(),
  canCreateLaws: z.boolean().optional(),
  canViewVerdicts: z.boolean().optional(),
  canCreateVerdicts: z.boolean().optional(),
  canViewCharges: z.boolean().optional(),
  canCreateCharges: z.boolean().optional(),
  canViewCaseFiles: z.boolean().optional(),
  canCreateCaseFiles: z.boolean().optional(),
  canViewDeathCerts: z.boolean().optional(),
  canCreateDeathCerts: z.boolean().optional(),
  canViewMedicalRecords: z.boolean().optional(),
  canCreateMedicalRecords: z.boolean().optional(),
  canViewAdminLog: z.boolean().optional(),
  canViewNews: z.boolean().optional(),
  canCreateNews: z.boolean().optional(),
  canViewWarnings: z.boolean().optional(),
  canCreateWarnings: z.boolean().optional(),
  canViewTrainingRecords: z.boolean().optional(),
  canCreateTrainingRecords: z.boolean().optional(),
  canViewDispatchLog: z.boolean().optional(),
  canCreateDispatchLog: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const permissions = await prisma.orgPermission.findUnique({
    where: { organizationId: id },
  });

  return NextResponse.json({ data: permissions });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = permissionsSchema.parse(body);

    const permissions = await prisma.orgPermission.upsert({
      where: { organizationId: id },
      update: data,
      create: { organizationId: id, ...data },
    });

    await createAdminLog('PERMISSION_CHANGED', `Berechtigungen für Organisation ${id} geändert`, session.user.id, id, 'Organization');

    return NextResponse.json({ data: permissions });
  } catch (error) {
    console.error('[organizations/:id/permissions PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
