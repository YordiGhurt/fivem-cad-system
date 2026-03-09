'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewChargePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    citizenName: '',
    citizenId: '',
    description: '',
    status: 'PENDING' as 'PENDING' | 'ACTIVE' | 'DISMISSED' | 'SERVED',
    lawId: '',
    caseFileId: '',
    incidentId: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName: form.citizenName,
          citizenId: form.citizenId || undefined,
          description: form.description,
          status: form.status,
          lawId: form.lawId || undefined,
          caseFileId: form.caseFileId || undefined,
          incidentId: form.incidentId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/charges');
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
          href="/dashboard/charges"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neue Anklage</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className={labelClass}>Beschreibung *</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Anklagebeschreibung"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
            >
              <option value="PENDING">Ausstehend</option>
              <option value="ACTIVE">Aktiv</option>
              <option value="DISMISSED">Eingestellt</option>
              <option value="SERVED">Vollstreckt</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Gesetzes-ID</label>
              <input
                className={inputClass}
                value={form.lawId}
                onChange={(e) => setForm({ ...form, lawId: e.target.value })}
                placeholder="Optionale Verknüpfung"
              />
            </div>
            <div>
              <label className={labelClass}>Parteiakten-ID</label>
              <input
                className={inputClass}
                value={form.caseFileId}
                onChange={(e) => setForm({ ...form, caseFileId: e.target.value })}
                placeholder="Optionale Verknüpfung"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Einsatz-ID</label>
            <input
              className={inputClass}
              value={form.incidentId}
              onChange={(e) => setForm({ ...form, incidentId: e.target.value })}
              placeholder="Optionale Verknüpfung"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/charges"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Anklage erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
