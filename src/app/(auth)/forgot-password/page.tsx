'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setToken(data.token ?? null);
      } else {
        setError(data.error ?? 'Ein Fehler ist aufgetreten.');
        setStatus('error');
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuche es erneut.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔑</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Passwort vergessen</h1>
          <p className="text-slate-400 text-sm mt-2">
            Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <p className="text-green-400 font-medium">Reset-Anfrage erhalten!</p>
            <p className="text-slate-400 text-sm mt-2">
              Falls ein Konto mit dieser E-Mail existiert, wurde ein Token generiert.
            </p>
            {token && (
              <div className="mt-3 p-2 bg-slate-800 rounded-lg">
                <p className="text-slate-500 text-xs mb-1">Token (für Entwicklung):</p>
                <p className="text-slate-300 text-xs font-mono break-all">{token}</p>
              </div>
            )}
            <Link
              href={`/reset-password${token ? `?token=${token}` : ''}`}
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Passwort zurücksetzen →
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-slate-300 text-sm font-medium mb-1.5">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="benutzer@example.com"
                className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {status === 'loading' ? 'Wird gesendet...' : 'Reset-Link anfordern'}
            </button>
          </form>
        )}

        <p className="text-center text-slate-500 text-sm mt-6">
          <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
            ← Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  );
}
