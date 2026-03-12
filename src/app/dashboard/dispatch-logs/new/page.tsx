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

export default function NewDispatchLogPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdminOrSupervisor =
    session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPERVISOR';
  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [form, setForm] = useState({
    organizationId: session?.user?.organizationId ?? '',
    shiftStart: localIso,
    shiftEnd: '',
    callsHandled: 0,
    notes: '',
  });
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAdminOrSupervisor) {
      setForm((prev) => ({ ...prev, organizationId: session?.user?.organizationId ?? '' }));
      return;
    }
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((d) => setOrgs(d.data ?? []))
      .catch(() => {});
  }, [isAdminOrSupervisor, session?.user?.organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/dispatch-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: form.organizationId,
          shiftStart: form.shiftStart,
          shiftEnd: form.shiftEnd || undefined,
          callsHandled: form.callsHandled,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/dispatch-logs');
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
          href="/dashboard/dispatch-logs"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neue Schicht eintragen</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdminOrSupervisor && (
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
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Schichtbeginn *</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.shiftStart}
                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Schichtende</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.shiftEnd}
                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Anzahl Einsätze</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.callsHandled}
              onChange={(e) => setForm({ ...form, callsHandled: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div>
            <label className={labelClass}>Notizen</label>
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Anmerkungen zur Schicht, besondere Vorkommnisse..."
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/dispatch-logs"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Schicht eintragen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
