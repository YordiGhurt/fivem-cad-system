'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  callsign: string;
}

interface User {
  id: string;
  username: string;
}

export default function NewOrgWarningPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'MINOR' as 'MINOR' | 'MAJOR' | 'FINAL',
    targetUserId: '',
    organizationId: '',
  });
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((d) => {
        setOrgs(d.data ?? []);
        if (session?.user?.organizationId) {
          setForm((prev) => ({ ...prev, organizationId: session.user.organizationId! }));
        }
      })
      .catch(() => {});
    fetch('/api/users?pageSize=200')
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .catch(() => {});
  }, [session?.user?.organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/org-warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/org-warnings');
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';
  const labelClass = 'block text-slate-400 text-xs font-medium uppercase mb-1.5';

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/org-warnings"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neue Abmahnung</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Titel *</label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Kurze Beschreibung des Vorfalls"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Beschreibung *</label>
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detaillierte Beschreibung des Vorfalls und der Konsequenzen"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Schwere *</label>
              <select
                className={inputClass}
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value as 'MINOR' | 'MAJOR' | 'FINAL' })}
              >
                <option value="MINOR">Leicht</option>
                <option value="MAJOR">Schwer</option>
                <option value="FINAL">Final (Letzte Abmahnung)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Organisation *</label>
              <select
                className={inputClass}
                value={form.organizationId}
                onChange={(e) => setForm({ ...form, organizationId: e.target.value })}
                required
              >
                <option value="">— Organisation wählen —</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.callsign} – {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Betroffener Mitarbeiter *</label>
            <select
              className={inputClass}
              value={form.targetUserId}
              onChange={(e) => setForm({ ...form, targetUserId: e.target.value })}
              required
            >
              <option value="">— Mitarbeiter wählen —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/org-warnings"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Abmahnung erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
