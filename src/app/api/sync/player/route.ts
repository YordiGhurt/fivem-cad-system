import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const syncSchema = z.object({
  citizenId: z.string(),
  steamId: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.CAD_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = syncSchema.parse(body);

    const citizen = await prisma.citizen.upsert({
      where: { citizenId: data.citizenId },
      update: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      create: {
        citizenId: data.citizenId,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        phone: data.phone,
      },
    });

    return NextResponse.json({ data: citizen });
  } catch (error) {
    console.error('[sync/player]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
