'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewFineEntryPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    offense: '',
    category: 'Vergehen',
    legalSection: '',
    fineMin: '',
    fineMax: '',
    jailMin: '',
    jailMax: '',
    seizure: '',
    additionalInfo: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/fine-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offense: form.offense,
          category: form.category,
          legalSection: form.legalSection,
          fineMin: parseInt(form.fineMin) || 0,
          fineMax: parseInt(form.fineMax) || 0,
          jailMin: parseInt(form.jailMin) || 0,
          jailMax: parseInt(form.jailMax) || 0,
          seizure: form.seizure || undefined,
          additionalInfo: form.additionalInfo || undefined,
          active: form.active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/fine-catalog');
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
          href="/dashboard/fine-catalog"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neuer Katalogeintrag</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Delikt *</label>
              <input
                className={inputClass}
                value={form.offense}
                onChange={(e) => setForm({ ...form, offense: e.target.value })}
                placeholder="z.B. Mord"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kategorie *</label>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Verbrechen">Verbrechen</option>
                <option value="Vergehen">Vergehen</option>
                <option value="Ordnungswidrigkeit">Ordnungswidrigkeit</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Paragraph *</label>
            <input
              className={inputClass}
              value={form.legalSection}
              onChange={(e) => setForm({ ...form, legalSection: e.target.value })}
              placeholder="z.B. PEN §4.1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Geldstrafe Min ($)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.fineMin}
                onChange={(e) => setForm({ ...form, fineMin: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Geldstrafe Max ($)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.fineMax}
                onChange={(e) => setForm({ ...form, fineMax: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Haftzeit Min (Monate)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.jailMin}
                onChange={(e) => setForm({ ...form, jailMin: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Haftzeit Max (Monate)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.jailMax}
                onChange={(e) => setForm({ ...form, jailMax: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Beschlagnahmung</label>
            <input
              className={inputClass}
              value={form.seizure}
              onChange={(e) => setForm({ ...form, seizure: e.target.value })}
              placeholder="z.B. Tatwaffe; Fluchtfahrzeug"
            />
          </div>

          <div>
            <label className={labelClass}>Zusätzliche Informationen</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.additionalInfo}
              onChange={(e) => setForm({ ...form, additionalInfo: e.target.value })}
              placeholder="Weitere Hinweise"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-800 border-slate-600"
            />
            <label htmlFor="active" className="text-slate-400 text-sm">Aktiv</label>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/fine-catalog"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Eintrag erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
