import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit } from '@/lib/rateLimit';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  if (!checkRateLimit(ip, 3, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Return success even if user not found to prevent enumeration
      return NextResponse.json({ message: 'If that email exists, a reset link has been generated.' });
    }

    // Invalidate previous tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, userId: user.id, expiresAt },
    });

    // No mail server – log token to console
    console.log(`[forgot-password] Reset token for ${email}: ${token}`);

    return NextResponse.json({ message: 'If that email exists, a reset link has been generated.', token });
  } catch (error) {
    console.error('[forgot-password POST]', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
