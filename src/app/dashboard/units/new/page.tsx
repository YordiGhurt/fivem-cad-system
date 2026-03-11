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

export default function NewUnitPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    callsign: '',
    userId: '',
    organizationId: '',
  });
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((d) => {
        setOrgs(d.data ?? []);
        const orgId = session?.user?.organizationId;
        if (orgId) {
          setForm((prev) => ({ ...prev, organizationId: orgId, userId: '' }));
          setUsers([]);
          setLoadingUsers(true);
          fetch(`/api/users?organizationId=${orgId}`)
            .then((r) => r.json())
            .then((d2) => setUsers(d2.data ?? []))
            .catch(() => setUsers([]))
            .finally(() => setLoadingUsers(false));
        }
      })
      .catch(() => {});
  }, [session?.user?.organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callsign: form.callsign,
          userId: form.userId,
          organizationId: form.organizationId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/units');
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  const handleOrgChange = (orgId: string) => {
    setForm({ ...form, organizationId: orgId, userId: '' });
    setUsers([]);
    if (!orgId) return;

    setLoadingUsers(true);
    fetch(`/api/users?organizationId=${orgId}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  };

  const inputClass =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';
  const labelClass = 'block text-slate-400 text-xs font-medium uppercase mb-1.5';

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/units"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neue Einheit</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Rufzeichen *</label>
            <input
              className={inputClass}
              value={form.callsign}
              onChange={(e) => setForm({ ...form, callsign: e.target.value })}
              placeholder="z.B. LSPD-1, EMS-4"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Organisation *</label>
            <select
              className={inputClass}
              value={form.organizationId}
              onChange={(e) => handleOrgChange(e.target.value)}
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

          <div>
            <label className={labelClass}>Benutzer *</label>
            <select
              className={inputClass}
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
              disabled={!form.organizationId || loadingUsers}
            >
              <option value="">
                {loadingUsers ? 'Lade Benutzer…' : '— Benutzer wählen —'}
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username}
                </option>
              ))}
            </select>
            {form.organizationId && !loadingUsers && users.length === 0 && (
              <p className="text-slate-500 text-xs mt-1">
                Keine Benutzer in dieser Organisation gefunden.
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/units"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Einheit erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
