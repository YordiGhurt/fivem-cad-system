'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RichTextEditor } from '@/components/RichTextEditor';

interface Organization {
  id: string;
  name: string;
  callsign: string;
}

export default function NewIncidentPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: '',
    description: '',
    location: '',
    status: 'ACTIVE' as 'ACTIVE' | 'PENDING' | 'CLOSED' | 'CANCELLED',
    priority: '3',
    organizationId: '',
  });
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((d) => setOrgs(d.data ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          description: form.description,
          location: form.location,
          status: form.status,
          priority: parseInt(form.priority),
          organizationId: form.organizationId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/incidents');
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
          href="/dashboard/incidents"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neuer Einsatz</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Einsatztyp *</label>
              <input
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                placeholder="z.B. Raub, Unfall, Feuer…"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Priorität *</label>
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="1">P1 – Kritisch</option>
                <option value="2">P2 – Hoch</option>
                <option value="3">P3 – Mittel</option>
                <option value="4">P4 – Niedrig</option>
                <option value="5">P5 – Minimal</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Ort *</label>
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Adresse / Ort des Einsatzes"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Beschreibung *</label>
            <RichTextEditor
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              placeholder="Einsatzbeschreibung"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Status</label>
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
              >
                <option value="ACTIVE">Aktiv</option>
                <option value="PENDING">Ausstehend</option>
                <option value="CLOSED">Geschlossen</option>
                <option value="CANCELLED">Abgebrochen</option>
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

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/incidents"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Einsatz erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
