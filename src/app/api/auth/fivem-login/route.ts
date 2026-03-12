import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, citizenId } = body as { username?: string; citizenId?: string };

    if (!username || !citizenId) {
      return NextResponse.json({ error: 'Fehlende Parameter: username und citizenId erforderlich' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const incomingCookies = req.headers.get('cookie') ?? '';

    // Schritt 1: CSRF-Token serverseitig holen
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
      headers: {
        cookie: incomingCookies,
      },
    });

    if (!csrfRes.ok) {
      return NextResponse.json({ error: `CSRF-Fetch fehlgeschlagen: ${csrfRes.status}` }, { status: 500 });
    }

    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

    if (!csrfToken) {
      return NextResponse.json({ error: 'Kein CSRF-Token erhalten' }, { status: 500 });
    }

    // CSRF-Cookie aus der Antwort weitergeben (nur name=value, ohne Direktiven wie Path/HttpOnly)
    const csrfSetCookie = csrfRes.headers.get('set-cookie') ?? '';
    const csrfCookiePair = csrfSetCookie.split(';')[0].trim();
    const allCookies = [incomingCookies, csrfCookiePair].filter(Boolean).join('; ');

    // Schritt 2: NextAuth-Login serverseitig ausführen
    const loginRes = await fetch(`${baseUrl}/api/auth/callback/fivem-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie: allCookies,
      },
      body: new URLSearchParams({
        csrfToken,
        username,
        password: citizenId,
        callbackUrl: '/dashboard',
        json: 'true',
      }),
      redirect: 'manual',
    });

    // Session-Cookie(s) aus der NextAuth-Antwort extrahieren und weiterleiten
    const response = NextResponse.json({ ok: true });

    // Alle set-cookie Header weiterleiten (Node 18+ unterstützt getSetCookie())
    const setCookieHeaders: string[] = [];
    if (typeof (loginRes.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function') {
      setCookieHeaders.push(...((loginRes.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()));
    } else {
      const single = loginRes.headers.get('set-cookie');
      if (single) setCookieHeaders.push(single);
    }

    if (setCookieHeaders.length === 0) {
      // Login fehlgeschlagen – kein Session-Cookie gesetzt
      return NextResponse.json(
        { error: 'Login fehlgeschlagen: Ungültiger Benutzername oder Bürger-ID' },
        { status: 401 }
      );
    }

    for (const cookie of setCookieHeaders) {
      response.headers.append('set-cookie', cookie);
    }

    return response;
  } catch (e) {
    console.error('[fivem-login] Fehler:', e);
    return NextResponse.json({ error: `Interner Fehler: ${e}` }, { status: 500 });
  }
}
