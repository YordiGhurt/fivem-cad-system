'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  callsign: string;
}

export default function NewDeathCertificatePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    deceasedName: '',
    citizenId: '',
    dateOfDeath: '',
    timeOfDeath: '',
    locationOfDeath: '',
    cause: 'UNKNOWN' as 'NATURAL' | 'ACCIDENT' | 'HOMICIDE' | 'SUICIDE' | 'UNKNOWN',
    causeDescription: '',
    organizationId: '',
    additionalNotes: '',
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
      const res = await fetch('/api/death-certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deceasedName: form.deceasedName,
          citizenId: form.citizenId || undefined,
          dateOfDeath: form.dateOfDeath,
          timeOfDeath: form.timeOfDeath || undefined,
          locationOfDeath: form.locationOfDeath,
          cause: form.cause,
          causeDescription: form.causeDescription,
          organizationId: form.organizationId,
          additionalNotes: form.additionalNotes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/death-certificates');
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
          href="/dashboard/death-certificates"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neuer Totenschein</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name des Verstorbenen *</label>
              <input
                className={inputClass}
                value={form.deceasedName}
                onChange={(e) => setForm({ ...form, deceasedName: e.target.value })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Todesdatum *</label>
              <input
                type="date"
                className={inputClass}
                value={form.dateOfDeath}
                onChange={(e) => setForm({ ...form, dateOfDeath: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Todeszeit</label>
              <input
                type="time"
                className={inputClass}
                value={form.timeOfDeath}
                onChange={(e) => setForm({ ...form, timeOfDeath: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Todesort *</label>
            <input
              className={inputClass}
              value={form.locationOfDeath}
              onChange={(e) => setForm({ ...form, locationOfDeath: e.target.value })}
              placeholder="Adresse / Ort"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Todesursache *</label>
            <select
              className={inputClass}
              value={form.cause}
              onChange={(e) => setForm({ ...form, cause: e.target.value as typeof form.cause })}
            >
              <option value="NATURAL">Natürlich</option>
              <option value="ACCIDENT">Unfall</option>
              <option value="HOMICIDE">Tötungsdelikt</option>
              <option value="SUICIDE">Suizid</option>
              <option value="UNKNOWN">Unbekannt</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Beschreibung der Todesursache *</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.causeDescription}
              onChange={(e) => setForm({ ...form, causeDescription: e.target.value })}
              placeholder="Detaillierte Beschreibung"
              required
            />
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

          <div>
            <label className={labelClass}>Zusätzliche Anmerkungen</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.additionalNotes}
              onChange={(e) => setForm({ ...form, additionalNotes: e.target.value })}
              placeholder="Weitere Informationen"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/death-certificates"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Totenschein erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
