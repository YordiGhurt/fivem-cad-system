'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FivemAuthContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const username = searchParams.get('username');
    const citizenId = searchParams.get('citizenid');

    if (!username || !citizenId) {
      setStatus('error');
      setErrorMsg('Ungültige Login-Parameter. Bitte /cad ingame erneut verwenden.');
      return;
    }

    async function doLogin() {
      try {
        // Credentials-Login mit Spielername + Bürger-ID.
        // Dieser Ansatz umgeht Cookie/JWT-Probleme im FiveM CEF-Browser,
        // da NextAuth den Session-Cookie synchron im selben Request-Zyklus setzt.
        const result = await signIn('fivem-credentials', {
          username,
          password: citizenId,
          redirect: false,
        });

        if (result?.error || !result?.ok) {
          setStatus('error');
          setErrorMsg('Anmeldung fehlgeschlagen. Spielername oder Bürger-ID ungültig.');
          return;
        }

        window.location.href = '/dashboard';
      } catch {
        setStatus('error');
        setErrorMsg('Verbindungsfehler. Bitte erneut versuchen.');
      }
    }

    doLogin();
  }, [searchParams]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-red-700 rounded-xl p-8 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Login fehlgeschlagen</h1>
            <p className="text-red-400 text-sm mb-6">{errorMsg}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Erneut versuchen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 shadow-2xl text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">FiveM CAD System</h1>
          <p className="text-slate-400 text-sm">Automatische Anmeldung läuft…</p>
        </div>
      </div>
    </div>
  );
}

export default function FivemAuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Laden…</div>
      </div>
    }>
      <FivemAuthContent />
    </Suspense>
  );
}
