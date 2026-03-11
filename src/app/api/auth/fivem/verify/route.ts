import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const verifySchema = z.object({
  token: z.string().min(1),
  citizenId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = verifySchema.parse(body);

    // Look up and validate token
    const authToken = await prisma.fivemAuthToken.findUnique({
      where: { token: data.token },
    });

    if (!authToken) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    if (authToken.citizenId !== data.citizenId) {
      return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }

    if (authToken.expiresAt < new Date()) {
      await prisma.fivemAuthToken.delete({ where: { id: authToken.id } });
      return NextResponse.json({ error: 'Token abgelaufen' }, { status: 401 });
    }

    // Token is single-use – delete immediately
    await prisma.fivemAuthToken.delete({ where: { id: authToken.id } });

    // Find matching organisation by job name
    const org = await prisma.organization.findUnique({
      where: { name: authToken.jobName },
    });

    // Find matching rank (level = gradeLevel + 1)
    const rank = org
      ? await prisma.orgRank.findFirst({
          where: { organizationId: org.id, level: authToken.gradeLevel + 1 },
        })
      : null;

    // Find or create user by citizenId
    let user = await prisma.user.findFirst({
      where: { citizenId: data.citizenId },
    });

    if (!user) {
      // Create new user – role always OFFICER, never ADMIN
      const tempPassword = await bcrypt.hash(randomUUID(), 10);
      user = await prisma.user.create({
        data: {
          username: data.citizenId,
          email: `${data.citizenId}@fivem.local`,
          password: tempPassword,
          citizenId: data.citizenId,
          role: Role.OFFICER,
          organizationId: org?.id ?? null,
          rankId: rank?.id ?? null,
        },
      });
    } else {
      // Update organisation and rank – but never downgrade SUPERVISOR/ADMIN roles
      const updateData: Record<string, string | null> = {};

      if (org) {
        updateData.organizationId = org.id;
      }
      if (rank) {
        updateData.rankId = rank.id;
      }

      // Only update role if currently USER or DISPATCHER (not SUPERVISOR/ADMIN/OFFICER)
      const shouldUpdateRole =
        user.role === Role.USER || user.role === Role.DISPATCHER;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...updateData,
          ...(shouldUpdateRole && { role: Role.OFFICER }),
        },
      });

      user = await prisma.user.findUnique({ where: { id: user.id } }) ?? user;
    }

    // Return user info so the client-side can perform NextAuth signIn
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error('[auth/fivem/verify]', error);
    return NextResponse.json({ error: 'Fehler beim Einlösen des Tokens' }, { status: 500 });
  }
}
