import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Role } from '@prisma/client';
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
    // FiveM Ingame-Login: Spielername als Benutzername, Bürger-ID als Passwort.
    // Dies umgeht Cookie/JWT-Probleme im CEF-Browser von FiveM, da der Login
    // synchron per standard NextAuth-Credentials-Flow erfolgt – kein Token-Polling nötig.
    // Beim ersten Login wird der Benutzer automatisch angelegt (Auto-Provisioning).
    CredentialsProvider({
      id: 'fivem-credentials',
      name: 'FiveM Credentials',
      credentials: {
        username: { label: 'Spielername', type: 'text' },
        password: { label: 'Bürger-ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        // Erst nach Spielername (korrekter Username) suchen
        let user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { organization: true },
        });

        // Fallback: nach Bürger-ID suchen (Migration bestehender Accounts, bei denen
        // die Bürger-ID fälschlicherweise als Username gespeichert wurde)
        if (!user) {
          const byId = await prisma.user.findFirst({
            where: { citizenId: credentials.password },
            include: { organization: true },
          });
          if (byId) {
            // Username auf Spielernamen korrigieren
            user = await prisma.user.update({
              where: { id: byId.id },
              data: { username: credentials.username },
              include: { organization: true },
            });
          }
        }

        // Auto-Provisioning: Benutzer beim ersten FiveM-Login automatisch anlegen.
        // Rolle ist immer OFFICER, nie ADMIN.
        if (!user) {
          const tempPassword = await bcrypt.hash(randomUUID(), 10);
          user = await prisma.user.create({
            data: {
              username: credentials.username,
              email: `${credentials.password}@fivem.local`,
              password: tempPassword,
              citizenId: credentials.password,
              role: Role.OFFICER,
              active: true,
            },
            include: { organization: true },
          });
        }

        if (!user.active) return null;

        // Bürger-ID als Authentifizierungsmerkmal – kein Passwort-Hash nötig
        if (user.citizenId !== credentials.password) return null;

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
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isHttpsContext,
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isHttpsContext,
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
