'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewCitizenPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    citizenId: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    address: '',
    nationality: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/citizens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          citizenId: form.citizenId,
          dateOfBirth: form.dateOfBirth || undefined,
          gender: form.gender || undefined,
          phone: form.phone || undefined,
          address: form.address || undefined,
          nationality: form.nationality || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/citizens');
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
          href="/dashboard/citizens"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neuer Bürger</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Vorname *</label>
              <input
                className={inputClass}
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Vorname"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Nachname *</label>
              <input
                className={inputClass}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Nachname"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bürger-ID *</label>
            <input
              className={inputClass}
              value={form.citizenId}
              onChange={(e) => setForm({ ...form, citizenId: e.target.value })}
              placeholder="z.B. CIT-002"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Geburtsdatum</label>
              <input
                type="date"
                className={inputClass}
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Geschlecht</label>
              <input
                className={inputClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                placeholder="z.B. männlich, weiblich"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Telefon</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="555-0100"
              />
            </div>
            <div>
              <label className={labelClass}>Nationalität</label>
              <input
                className={inputClass}
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                placeholder="z.B. US-Amerikanisch"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Adresse</label>
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Straße, Hausnummer, Stadt"
            />
          </div>

          <div>
            <label className={labelClass}>Notizen</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Zusätzliche Informationen"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/citizens"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Bürger erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
