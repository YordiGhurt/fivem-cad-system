import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const tokenSchema = z.object({
  citizenId: z.string().min(1),
  jobName: z.string().min(1),
  jobGradeLevel: z.number().int().min(0),
  jobGradeName: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.CAD_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = tokenSchema.parse(body);

    // Clean up expired tokens for this citizen
    await prisma.fivemAuthToken.deleteMany({
      where: {
        citizenId: data.citizenId,
        expiresAt: { lt: new Date() },
      },
    });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 1000); // 60 seconds

    await prisma.fivemAuthToken.create({
      data: {
        token,
        citizenId: data.citizenId,
        jobName: data.jobName,
        gradeLevel: data.jobGradeLevel,
        gradeName: data.jobGradeName,
        expiresAt,
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('[auth/fivem/token]', error);
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
