'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Citizen {
  id: string;
  firstName: string;
  lastName: string;
  citizenId: string;
}

interface Incident {
  id: string;
  caseNumber: string;
  type: string;
}

export default function NewWarrantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    citizenName: '',
    citizenId: '',
    reason: '',
    charges: '',
    expiresAt: '',
    incidentId: '',
  });
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/citizens?pageSize=200').then((r) => r.json()).then((d) => setCitizens(d.data ?? [])).catch(() => {});
    fetch('/api/incidents?pageSize=200').then((r) => r.json()).then((d) => setIncidents(d.data ?? [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/warrants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName: form.citizenName,
          citizenId: form.citizenId || undefined,
          reason: form.reason,
          charges: form.charges,
          expiresAt: form.expiresAt || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/warrants');
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
          href="/dashboard/warrants"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neuer Haftbefehl</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Citizen dropdown */}
          <div>
            <label className={labelClass}>Bürger auswählen</label>
            <select
              className={inputClass}
              value=""
              onChange={(e) => {
                const citizen = citizens.find((c) => c.id === e.target.value);
                if (citizen) setForm({ ...form, citizenName: `${citizen.firstName} ${citizen.lastName}`, citizenId: citizen.citizenId });
              }}
            >
              <option value="">— Bürger suchen —</option>
              {citizens.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.citizenId})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name des Bürgers *</label>
              <input
                className={inputClass}
                value={form.citizenName}
                onChange={(e) => setForm({ ...form, citizenName: e.target.value })}
                placeholder="Vor- und Nachname"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Bürger-ID</label>
              <input
                className={inputClass}
                value={form.citizenId}
                onChange={(e) => setForm({ ...form, citizenId: e.target.value })}
                placeholder="CIT-001"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Grund *</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Begründung für den Haftbefehl"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Anklagen *</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.charges}
              onChange={(e) => setForm({ ...form, charges: e.target.value })}
              placeholder="Anklagepunkte"
              required
            />
          </div>

          {/* Incident dropdown */}
          <div>
            <label className={labelClass}>Einsatz verknüpfen (optional)</label>
            <select
              className={inputClass}
              value={form.incidentId}
              onChange={(e) => setForm({ ...form, incidentId: e.target.value })}
            >
              <option value="">— Kein Einsatz —</option>
              {incidents.map((inc) => (
                <option key={inc.id} value={inc.id}>
                  {inc.caseNumber} – {inc.type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Ablaufdatum</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/warrants"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Haftbefehl erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

