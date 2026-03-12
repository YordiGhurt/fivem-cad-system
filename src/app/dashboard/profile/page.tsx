'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Shield, Lock, Radio } from 'lucide-react';

interface Unit {
  id: string;
  callsign: string;
  status: string;
  organization?: { name: string };
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [units, setUnits] = useState<Unit[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/units?userId=${session.user.id}`)
      .then((r) => r.json())
      .then((d) => setUnits(d.data ?? []))
      .catch(() => {});
  }, [session?.user?.id]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage('');
    setPwError('');

    if (newPassword !== confirmPassword) {
      setPwError('Passwörter stimmen nicht überein');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('Neues Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMessage(data.message ?? 'Passwort erfolgreich geändert');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwError(data.error ?? 'Fehler beim Ändern des Passworts');
      }
    } catch {
      setPwError('Netzwerkfehler');
    } finally {
      setPwLoading(false);
    }
  };

  const statusLabels: Record<string, string> = {
    AVAILABLE: 'Verfügbar',
    BUSY: 'Beschäftigt',
    ONSCENE: 'Am Einsatzort',
    ENROUTE: 'Unterwegs',
    BREAK: 'Pause',
    OFFDUTY: 'Außer Dienst',
  };

  const statusColors: Record<string, string> = {
    AVAILABLE: 'bg-green-500/20 text-green-400 border border-green-500/30',
    BUSY: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    ONSCENE: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    ENROUTE: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    BREAK: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    OFFDUTY: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  };

  if (!session) {
    return (
      <div className="p-6 text-slate-400">Nicht angemeldet</div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Mein Profil</h1>

      {/* Profile info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white uppercase">
              {session.user.username?.[0] ?? 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-white text-xl font-semibold">{session.user.username}</h2>
            <p className="text-slate-400 text-sm">{session.user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-xs uppercase tracking-wide">Rolle</span>
            </div>
            <p className="text-white text-sm font-medium">{session.user.role}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-xs uppercase tracking-wide">Organisation</span>
            </div>
            <p className="text-white text-sm font-medium">
              {session.user.organizationId ? 'Zugewiesen' : 'Keine'}
            </p>
          </div>
        </div>
      </div>

      {/* My Units */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-5 h-5 text-blue-400" />
          <h2 className="text-white font-semibold">Meine Einheiten</h2>
        </div>
        {units.length === 0 ? (
          <p className="text-slate-500 text-sm">
            Keine aktiven Einheiten.{' '}
            <Link href="/dashboard/units" className="text-blue-400 hover:text-blue-300">
              Einheit anlegen →
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {units.map((unit) => (
              <div key={unit.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
                <div>
                  <span className="text-white font-medium text-sm">{unit.callsign}</span>
                  {unit.organization && (
                    <span className="text-slate-500 text-xs ml-2">{unit.organization.name}</span>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[unit.status] ?? statusColors.OFFDUTY}`}>
                  {statusLabels[unit.status] ?? unit.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-yellow-400" />
          <h2 className="text-white font-semibold">Passwort ändern</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Aktuelles Passwort</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Neues Passwort</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Passwort bestätigen</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
          {pwMessage && <p className="text-green-400 text-sm">{pwMessage}</p>}

          <button
            type="submit"
            disabled={pwLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {pwLoading ? 'Wird gespeichert...' : 'Passwort ändern'}
          </button>
        </form>
      </div>
    </div>
  );
}
