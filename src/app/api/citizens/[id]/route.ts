import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAdminLog } from '@/lib/adminLog';
import { z } from 'zod';

const updateSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    nationality: z.string().optional(),
    notes: z.string().optional(),
  })
  .partial();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const citizen = await prisma.citizen.findUnique({
    where: { id },
    include: { vehicles: true, weapons: true },
  });

  if (!citizen) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: citizen });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden – Bürgerdaten sind schreibgeschützt' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const citizen = await prisma.citizen.update({
      where: { id },
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    return NextResponse.json({ data: citizen });
  } catch (error) {
    console.error('[citizens/:id PUT]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;

    const citizen = await prisma.citizen.findUnique({ where: { id } });
    if (!citizen) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const citizenId = citizen.citizenId;

    await prisma.$transaction(async (tx) => {
      // Collect IDs of verdicts and case files belonging to this citizen so we can
      // null out FK references from other records before deleting them.
      const [verdicts, caseFiles] = await Promise.all([
        tx.verdict.findMany({ where: { citizenId }, select: { id: true } }),
        tx.caseFile.findMany({ where: { citizenId }, select: { id: true } }),
      ]);
      const verdictIds = verdicts.map((v) => v.id);
      const caseFileIds = caseFiles.map((cf) => cf.id);

      // Null out cross-references from other records that point to this citizen's
      // verdicts / case files (FK columns are nullable, no cascade defined).
      if (verdictIds.length > 0) {
        await tx.charge.updateMany({
          where: { verdictId: { in: verdictIds } },
          data: { verdictId: null },
        });
      }
      if (caseFileIds.length > 0) {
        await tx.charge.updateMany({
          where: { caseFileId: { in: caseFileIds }, citizenId: { not: citizenId } },
          data: { caseFileId: null },
        });
        await tx.verdict.updateMany({
          where: { caseFileId: { in: caseFileIds }, citizenId: { not: citizenId } },
          data: { caseFileId: null },
        });
      }

      // Delete all records owned by this citizen, then the citizen itself.
      await tx.medicalRecord.deleteMany({ where: { citizenId } });
      await tx.deathCertificate.deleteMany({ where: { citizenId } });
      await tx.charge.deleteMany({ where: { citizenId } });
      await tx.verdict.deleteMany({ where: { citizenId } });
      await tx.caseFile.deleteMany({ where: { citizenId } });
      await tx.weapon.deleteMany({ where: { ownerId: citizenId } });
      await tx.vehicle.deleteMany({ where: { ownerId: citizenId } });
      await tx.citizen.delete({ where: { id } });
    });

    await createAdminLog('DATA_DELETED', `Bürger ${id} (${citizen.firstName} ${citizen.lastName}) gelöscht`, session.user.id, id, 'Citizen');
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[citizens/:id DELETE]', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Bürgers' }, { status: 500 });
  }
}
