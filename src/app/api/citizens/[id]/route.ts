import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    if (!citizen) return NextResponse.json({ error: 'Bürger nicht gefunden' }, { status: 404 });

    const cId = citizen.citizenId;

    await prisma.$transaction(async (tx) => {
      // Charges reference Verdict and CaseFile, so delete first
      await tx.charge.deleteMany({ where: { citizenId: cId } });
      // Verdicts reference CaseFile, so delete before CaseFile
      await tx.verdict.deleteMany({ where: { citizenId: cId } });
      // CaseDocuments cascade automatically when CaseFile is deleted
      await tx.caseFile.deleteMany({ where: { citizenId: cId } });
      await tx.weapon.deleteMany({ where: { ownerId: cId } });
      await tx.vehicle.deleteMany({ where: { ownerId: cId } });
      await tx.medicalRecord.deleteMany({ where: { citizenId: cId } });
      await tx.deathCertificate.deleteMany({ where: { citizenId: cId } });
      await tx.citizen.delete({ where: { id } });
      await tx.adminLog.create({
        data: {
          action: 'DATA_DELETED',
          description: `Bürger ${citizen.firstName} ${citizen.lastName} (${cId}) gelöscht`,
          performedById: session.user.id,
          targetId: id,
          targetType: 'Citizen',
        },
      });
    });

    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('[citizens/:id DELETE]', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Bürgers' }, { status: 500 });
  }
}
