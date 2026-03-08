import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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

    return NextResponse.json({ data: permissions });
  } catch (error) {
    console.error('[organizations/:id/permissions PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
