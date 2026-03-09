'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RichTextEditor } from '@/components/RichTextEditor';

interface Incident {
  id: string;
  caseNumber: string;
  type: string;
}

export default function NewReportPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'INCIDENT' as 'INCIDENT' | 'ARREST' | 'WARRANT' | 'MEDICAL' | 'CUSTOM',
    incidentId: '',
  });
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/incidents?pageSize=200')
      .then((r) => r.json())
      .then((d) => setIncidents(d.data ?? []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          type: form.type,
          incidentId: form.incidentId || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/reports');
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
          href="/dashboard/reports"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neuer Bericht</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Titel *</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Berichtstitel"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Berichtstyp *</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
              >
                <option value="INCIDENT">Einsatz</option>
                <option value="ARREST">Verhaftung</option>
                <option value="WARRANT">Haftbefehl</option>
                <option value="MEDICAL">Medizinisch</option>
                <option value="CUSTOM">Sonstiges</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Inhalt *</label>
            <RichTextEditor
              value={form.content}
              onChange={(v) => setForm({ ...form, content: v })}
              placeholder="Berichtsinhalt"
              minHeight="200px"
            />
          </div>

          <div>
            <label className={labelClass}>Einsatz verknüpfen</label>
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

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/reports"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Bericht erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

