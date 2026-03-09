'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewLawPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    category: 'CRIMINAL' as 'CRIMINAL' | 'CIVIL' | 'TRAFFIC' | 'ADMINISTRATIVE',
    penalty: '',
    fineAmount: '',
    jailTime: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/laws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          title: form.title,
          description: form.description,
          category: form.category,
          penalty: form.penalty || undefined,
          fineAmount: form.fineAmount ? parseFloat(form.fineAmount) : undefined,
          jailTime: form.jailTime ? parseInt(form.jailTime) : undefined,
          active: form.active,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/laws');
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
          href="/dashboard/laws"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neues Gesetz</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Code *</label>
              <input
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="z.B. §123"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Kategorie *</label>
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as typeof form.category })
                }
              >
                <option value="CRIMINAL">Strafrecht</option>
                <option value="CIVIL">Zivilrecht</option>
                <option value="TRAFFIC">Verkehrsrecht</option>
                <option value="ADMINISTRATIVE">Verwaltungsrecht</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Titel *</label>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Gesetzesbezeichnung"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Beschreibung *</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Gesetzestext / Beschreibung"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Strafe (Text)</label>
            <input
              className={inputClass}
              value={form.penalty}
              onChange={(e) => setForm({ ...form, penalty: e.target.value })}
              placeholder="z.B. Freiheitsstrafe bis zu 2 Jahren"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Geldstrafe ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={inputClass}
                value={form.fineAmount}
                onChange={(e) => setForm({ ...form, fineAmount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className={labelClass}>Haftzeit (Monate)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.jailTime}
                onChange={(e) => setForm({ ...form, jailTime: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  form.active ? 'bg-green-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.active ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-slate-400 text-sm">Aktiv</span>
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/laws"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Gesetz erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
