import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkOrgPermission } from '@/lib/checkOrgPermission';
import { z } from 'zod';

const createSchema = z.object({
  citizenName: z.string().min(1),
  citizenId: z.string().optional(),
  diagnosis: z.string().min(1),
  treatment: z.string().optional(),
  medications: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  organizationId: z.string().min(1),
  incidentId: z.string().optional(),
  confidential: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { citizenName: { contains: search, mode: 'insensitive' } },
      { recordNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      include: {
        author: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  return NextResponse.json({ data: records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await checkOrgPermission(session.user.id, 'canCreateMedicalRecords');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const recordNumber = `MR-${Date.now()}`;

    const record = await prisma.medicalRecord.create({
      data: { ...data, recordNumber, authorId: session.user.id },
      include: {
        author: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: record }, { status: 201 });
  } catch (error) {
    console.error('[medical-records POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
