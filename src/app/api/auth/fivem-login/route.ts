import { NextRequest, NextResponse } from 'next/server';

// Hilfsfunktion: Serverseitigen NextAuth-Login durchführen
async function performFivemLogin(
  username: string,
  citizenId: string,
  incomingCookies: string,
  baseUrl: string
): Promise<{ sessionCookies: string[]; error?: string }> {
  // Schritt 1: CSRF-Token serverseitig holen
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`, {
    headers: { cookie: incomingCookies },
  });

  if (!csrfRes.ok) {
    return { sessionCookies: [], error: `CSRF-Fetch fehlgeschlagen: ${csrfRes.status}` };
  }

  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  if (!csrfToken) {
    return { sessionCookies: [], error: 'Kein CSRF-Token erhalten' };
  }

  // CSRF-Cookie weitergeben (nur name=value, ohne Direktiven)
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

  // Session-Cookies extrahieren
  const setCookieHeaders: string[] = [];
  const headersWithGetSetCookie = loginRes.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof headersWithGetSetCookie.getSetCookie === 'function') {
    setCookieHeaders.push(...headersWithGetSetCookie.getSetCookie());
  } else {
    const single = loginRes.headers.get('set-cookie');
    if (single) setCookieHeaders.push(single);
  }

  if (setCookieHeaders.length === 0) {
    return { sessionCookies: [], error: 'Login fehlgeschlagen: Ungültiger Benutzername oder Bürger-ID' };
  }

  return { sessionCookies: setCookieHeaders };
}

// GET-Handler: Wird per fetch() aus dem Client aufgerufen (kein window.location.href).
// Gibt 200 JSON { ok: true } zurück und setzt den Session-Cookie via Set-Cookie-Header.
// Der Client navigiert danach selbst per window.location.replace('/dashboard').
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    const citizenId = searchParams.get('citizenid');

    if (!username || !citizenId) {
      return NextResponse.redirect(
        new URL('/login?error=missing-params', req.url)
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const incomingCookies = req.headers.get('cookie') ?? '';

    const { sessionCookies, error } = await performFivemLogin(username, citizenId, incomingCookies, baseUrl);

    if (error || sessionCookies.length === 0) {
      console.error('[fivem-login GET] Fehler:', error);
      return NextResponse.redirect(new URL('/login?error=fivem-login-failed', req.url));
    }

    // JSON-Antwort statt Redirect – der Client navigiert selbst nach /dashboard.
    // So werden die Set-Cookie-Header zuverlässig im fetch()-Response verarbeitet.
    const response = NextResponse.json({ ok: true });
    for (const cookie of sessionCookies) {
      response.headers.append('set-cookie', cookie);
    }
    return response;
  } catch (e) {
    console.error('[fivem-login GET] Fehler:', e);
    return NextResponse.redirect(new URL('/login?error=server-error', req.url));
  }
}

// POST-Handler: Bleibt für Rückwärtskompatibilität erhalten
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, citizenId } = body as { username?: string; citizenId?: string };

    if (!username || !citizenId) {
      return NextResponse.json({ error: 'Fehlende Parameter: username und citizenId erforderlich' }, { status: 400 });
    }

    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const incomingCookies = req.headers.get('cookie') ?? '';

    const { sessionCookies, error } = await performFivemLogin(username, citizenId, incomingCookies, baseUrl);

    if (error || sessionCookies.length === 0) {
      return NextResponse.json(
        { error: error ?? 'Login fehlgeschlagen: Ungültiger Benutzername oder Bürger-ID' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    for (const cookie of sessionCookies) {
      response.headers.append('set-cookie', cookie);
    }
    return response;
  } catch (e) {
    console.error('[fivem-login] Fehler:', e);
    return NextResponse.json({ error: `Interner Fehler: ${e}` }, { status: 500 });
  }
}
