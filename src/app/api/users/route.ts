import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { createAdminLog } from '@/lib/adminLog';

const createSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'OFFICER', 'DISPATCHER', 'USER']),
  organizationId: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    include: { organization: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        organizationId: data.organizationId ?? null,
      },
      include: { organization: true },
    });

    await createAdminLog('USER_CREATED', `Benutzer "${data.username}" erstellt`, session.user.id, user.id, 'User');

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    console.error('[users POST]', error);
    return NextResponse.json({ error: 'Invalid data or username/email already exists' }, { status: 400 });
  }
}
