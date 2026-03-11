import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

// Cookie-Konfiguration für FiveM CEF-Browser-Kompatibilität.
// FiveM nutzt einen eingebetteten Chromium-Browser (CEF), der auf http://-URLs
// keine Cookies mit dem Secure-Flag akzeptiert. Daher wird 'secure' aus der
// NEXTAUTH_URL abgeleitet.
// ⚠️ PRODUKTION: NEXTAUTH_URL auf https://... setzen, damit secure=true automatisch gilt.
const isHttpsContext = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { organization: true },
        });

        if (!user || !user.active) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId ?? undefined,
        };
      },
    }),
    CredentialsProvider({
      id: 'fivem-token',
      name: 'FiveM Token',
      credentials: {
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.userId) return null;

        const user = await prisma.user.findUnique({
          where: { id: credentials.userId },
          include: { organization: true },
        });

        if (!user || !user.active) return null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username: string }).username;
        token.role = (user as { role: string }).role;
        token.organizationId = (user as { organizationId?: string }).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  // Explizite Cookie-Einstellungen für Kompatibilität mit dem FiveM-Ingame-Browser (CEF).
  // Der CEF-Browser speichert Cookies auf http://-URLs nicht, wenn secure=true gesetzt ist.
  // sameSite: 'lax' ist die sicherste Option, die mit CEF zuverlässig funktioniert.
  // ⚠️ PRODUKTION: NEXTAUTH_URL auf https://... setzen – dann wird secure=true automatisch verwendet.
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        // secure: false bei http:// (lokal/FiveM), true bei https:// (Produktion)
        secure: isHttpsContext,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
