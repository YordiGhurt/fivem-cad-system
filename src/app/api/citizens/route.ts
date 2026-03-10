import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkOrgPermission } from '@/lib/checkOrgPermission';
import { z } from 'zod';

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  citizenId: z.string().min(1),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await checkOrgPermission(session.user.id, 'canViewCitizens');
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { citizenId: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [citizens, total] = await Promise.all([
    prisma.citizen.findMany({
      where,
      orderBy: { lastName: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.citizen.count({ where }),
  ]);

  return NextResponse.json({
    data: citizens,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const citizen = await prisma.citizen.create({
      data: {
        ...data,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    return NextResponse.json({ data: citizen }, { status: 201 });
  } catch (error) {
    console.error('[citizens POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
