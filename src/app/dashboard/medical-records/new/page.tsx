'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  callsign: string;
}

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    citizenName: '',
    citizenId: '',
    diagnosis: '',
    treatment: '',
    medications: '',
    bloodType: '',
    allergies: '',
    organizationId: '',
    incidentId: '',
    confidential: false,
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
      const res = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName: form.citizenName,
          citizenId: form.citizenId || undefined,
          diagnosis: form.diagnosis,
          treatment: form.treatment || undefined,
          medications: form.medications || undefined,
          bloodType: form.bloodType || undefined,
          allergies: form.allergies || undefined,
          organizationId: form.organizationId,
          incidentId: form.incidentId || undefined,
          confidential: form.confidential,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/medical-records');
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
          href="/dashboard/medical-records"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neue Medizinische Akte</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name des Patienten *</label>
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
            <label className={labelClass}>Diagnose *</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.diagnosis}
              onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
              placeholder="Medizinische Diagnose"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Behandlung</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.treatment}
              onChange={(e) => setForm({ ...form, treatment: e.target.value })}
              placeholder="Durchgeführte Behandlung"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Medikamente</label>
              <input
                className={inputClass}
                value={form.medications}
                onChange={(e) => setForm({ ...form, medications: e.target.value })}
                placeholder="Verschriebene Medikamente"
              />
            </div>
            <div>
              <label className={labelClass}>Blutgruppe</label>
              <input
                className={inputClass}
                value={form.bloodType}
                onChange={(e) => setForm({ ...form, bloodType: e.target.value })}
                placeholder="z.B. A+"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Allergien</label>
            <input
              className={inputClass}
              value={form.allergies}
              onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              placeholder="Bekannte Allergien"
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
            <label className={labelClass}>Einsatz-ID</label>
            <input
              className={inputClass}
              value={form.incidentId}
              onChange={(e) => setForm({ ...form, incidentId: e.target.value })}
              placeholder="Optionale Verknüpfung"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setForm({ ...form, confidential: !form.confidential })}
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  form.confidential ? 'bg-red-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.confidential ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-slate-400 text-sm">Vertraulich</span>
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/medical-records"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Akte erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
