import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const flagSchema = z.object({
  plate: z.string(),
  flagged: z.boolean(),
  flagReason: z.string().optional(),
  stolen: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const data = flagSchema.parse(body);

    const vehicle = await prisma.vehicle.update({
      where: { plate: data.plate },
      data: {
        flagged: data.flagged,
        flagReason: data.flagReason,
        stolen: data.stolen ?? false,
      },
    });

    return NextResponse.json({ data: vehicle });
  } catch (error) {
    console.error('[vehicles/flag POST]', error);
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  }
}
