'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface FineEntry {
  id: string;
  offense: string;
  category: string;
  legalSection: string;
  fineMin: number;
  fineMax: number;
  jailMin: number;
  jailMax: number;
  seizure: string | null;
  additionalInfo: string | null;
  active: boolean;
}

export default function EditFineEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState('');
  const [entry, setEntry] = useState<FineEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    params.then(({ id: paramId }) => {
      setId(paramId);
      fetch(`/api/fine-catalog/${paramId}`)
        .then((r) => r.json())
        .then((d) => setEntry(d.data ?? null))
        .catch(() => setError('Eintrag nicht gefunden'))
        .finally(() => setLoading(false));
    });
  }, [params]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!entry) return;
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/fine-catalog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offense: entry.offense,
          category: entry.category,
          legalSection: entry.legalSection,
          fineMin: entry.fineMin,
          fineMax: entry.fineMax,
          jailMin: entry.jailMin,
          jailMax: entry.jailMax,
          seizure: entry.seizure ?? undefined,
          additionalInfo: entry.additionalInfo ?? undefined,
          active: entry.active,
        }),
      });

      if (res.ok) {
        router.push('/dashboard/fine-catalog');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Speichern');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-slate-400">Wird geladen...</div>;
  }

  if (!entry) {
    return <div className="p-6 text-red-400">{error || 'Eintrag nicht gefunden'}</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/fine-catalog"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück zum Bußgeldkatalog
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-white mb-6">Eintrag bearbeiten</h1>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-slate-400 text-sm mb-1">Delikt *</label>
          <input
            value={entry.offense}
            onChange={(e) => setEntry({ ...entry, offense: e.target.value })}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Kategorie *</label>
          <select
            value={entry.category}
            onChange={(e) => setEntry({ ...entry, category: e.target.value })}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="Verbrechen">Verbrechen</option>
            <option value="Vergehen">Vergehen</option>
            <option value="Ordnungswidrigkeit">Ordnungswidrigkeit</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Paragraph *</label>
          <input
            value={entry.legalSection}
            onChange={(e) => setEntry({ ...entry, legalSection: e.target.value })}
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Geldstrafe Min ($)</label>
            <input
              type="number"
              min={0}
              value={entry.fineMin}
              onChange={(e) => setEntry({ ...entry, fineMin: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Geldstrafe Max ($)</label>
            <input
              type="number"
              min={0}
              value={entry.fineMax}
              onChange={(e) => setEntry({ ...entry, fineMax: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-1">Haftzeit Min (Monate)</label>
            <input
              type="number"
              min={0}
              value={entry.jailMin}
              onChange={(e) => setEntry({ ...entry, jailMin: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Haftzeit Max (Monate)</label>
            <input
              type="number"
              min={0}
              value={entry.jailMax}
              onChange={(e) => setEntry({ ...entry, jailMax: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Beschlagnahmung</label>
          <input
            value={entry.seizure ?? ''}
            onChange={(e) => setEntry({ ...entry, seizure: e.target.value || null })}
            placeholder="z.B. Fahrzeug, Waffe..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-1">Zusatzinformationen</label>
          <textarea
            value={entry.additionalInfo ?? ''}
            onChange={(e) => setEntry({ ...entry, additionalInfo: e.target.value || null })}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={entry.active}
            onChange={(e) => setEntry({ ...entry, active: e.target.checked })}
            className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-slate-300 text-sm">Aktiv (im Bußgeldkatalog anzeigen)</span>
        </label>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </button>
          <Link
            href="/dashboard/fine-catalog"
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Abbrechen
          </Link>
        </div>
      </form>
    </div>
  );
}
