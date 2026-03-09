'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RichTextEditor } from '@/components/RichTextEditor';

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

interface FineEntry {
  id: string;
  offense: string;
  legalSection: string;
  fineMin: number;
  fineMax: number;
  jailMin: number;
  jailMax: number;
  category: string;
}

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
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [fineEntries, setFineEntries] = useState<FineEntry[]>([]);
  const [fineHint, setFineHint] = useState<FineEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/citizens?pageSize=200').then((r) => r.json()).then((d) => setCitizens(d.data ?? [])).catch(() => {});
    fetch('/api/incidents?pageSize=200').then((r) => r.json()).then((d) => setIncidents(d.data ?? [])).catch(() => {});
    fetch('/api/fine-catalog?pageSize=200').then((r) => r.json()).then((d) => setFineEntries(d.data ?? [])).catch(() => {});
  }, []);

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

          {/* Fine catalog dropdown */}
          {fineEntries.length > 0 && (
            <div>
              <label className={labelClass}>Aus Bußgeldkatalog</label>
              <select
                className={inputClass}
                value=""
                onChange={(e) => {
                  const entry = fineEntries.find((f) => f.id === e.target.value);
                  if (entry) {
                    setFineHint(entry);
                    setForm((f) => ({
                      ...f,
                      description: `${entry.offense} (${entry.legalSection})`,
                    }));
                  }
                }}
              >
                <option value="">— Delikt auswählen —</option>
                {fineEntries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.offense} – {entry.legalSection}
                  </option>
                ))}
              </select>
              {fineHint && (
                <div className="mt-2 bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs text-slate-300">
                  <span className="text-slate-400">Strafe: </span>
                  ${fineHint.fineMin}–${fineHint.fineMax} |{' '}
                  {fineHint.jailMin}–{fineHint.jailMax} Monate Haft
                </div>
              )}
            </div>
          )}

          <div>
            <label className={labelClass}>Beschreibung *</label>
            <RichTextEditor
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              placeholder="Anklagebeschreibung"
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

          {/* Incident dropdown */}
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

