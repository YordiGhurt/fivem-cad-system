import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z, ZodError } from 'zod';

const syncSchema = z.object({
  citizenId: z.string().min(1),
  weapons: z.array(
    z.object({
      serialNumber: z.string().min(1),
      model: z.string().min(1),
      licensed: z.boolean().optional(),
    }),
  ),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.CAD_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = syncSchema.parse(body);

    const citizen = await prisma.citizen.findUnique({ where: { citizenId: data.citizenId } });
    if (!citizen) {
      return NextResponse.json({ error: 'Citizen not found' }, { status: 404 });
    }

    const upserted = await Promise.all(
      data.weapons.map((weapon) =>
        prisma.weapon.upsert({
          where: { serialNumber: weapon.serialNumber },
          update: {
            model: weapon.model,
            licensed: weapon.licensed ?? false,
            ownerId: data.citizenId,
          },
          create: {
            serialNumber: weapon.serialNumber,
            model: weapon.model,
            ownerId: data.citizenId,
            licensed: weapon.licensed ?? false,
          },
        }),
      ),
    );

    return NextResponse.json({ success: true, count: upserted.length });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('[sync/weapons] Validation error', error.errors);
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 422 });
    }
    console.error('[sync/weapons]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
