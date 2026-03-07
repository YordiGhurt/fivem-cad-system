import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  plate: z.string().min(1),
  model: z.string().min(1),
  color: z.string().min(1),
  ownerId: z.string(),
  registrationExpiry: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');
  const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

  const where = search
    ? {
        OR: [
          { plate: { contains: search, mode: 'insensitive' as const } },
          { model: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return NextResponse.json({
    data: vehicles,
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

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        registrationExpiry: data.registrationExpiry
          ? new Date(data.registrationExpiry)
          : undefined,
      },
      include: { owner: true },
    });

    return NextResponse.json({ data: vehicle }, { status: 201 });
  } catch (error) {
    console.error('[vehicles POST]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
