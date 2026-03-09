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

interface CaseFile {
  id: string;
  caseNumber: string;
  title: string;
}

interface Charge {
  id: string;
  citizenName: string;
  citizenId: string | null;
  caseFileId: string | null;
  status: string;
}

export default function NewVerdictPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    citizenName: '',
    citizenId: '',
    type: 'GUILTY' as 'GUILTY' | 'NOT_GUILTY' | 'PLEA_DEAL' | 'DISMISSED',
    sentence: '',
    jailTime: '',
    fineAmount: '',
    caseFileId: '',
    notes: '',
  });
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/citizens?pageSize=200').then((r) => r.json()).then((d) => setCitizens(d.data ?? [])).catch(() => {});
    fetch('/api/case-files?pageSize=200').then((r) => r.json()).then((d) => setCaseFiles(d.data ?? [])).catch(() => {});
    fetch('/api/charges?pageSize=200&status=ACTIVE').then((r) => r.json()).then((d) => setCharges(d.data ?? [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/verdicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName: form.citizenName,
          citizenId: form.citizenId || undefined,
          type: form.type,
          sentence: form.sentence || undefined,
          jailTime: form.jailTime ? parseInt(form.jailTime) : undefined,
          fineAmount: form.fineAmount ? parseFloat(form.fineAmount) : undefined,
          caseFileId: form.caseFileId || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/verdicts');
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
          href="/dashboard/verdicts"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neues Urteil</h1>
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

          {/* Link existing charge */}
          {charges.length > 0 && (
            <div>
              <label className={labelClass}>Vorhandene Anklage verknüpfen</label>
              <select
                className={inputClass}
                value=""
                onChange={(e) => {
                  const charge = charges.find((c) => c.id === e.target.value);
                  if (charge) {
                    setForm((f) => ({
                      ...f,
                      citizenName: charge.citizenName,
                      citizenId: charge.citizenId ?? f.citizenId,
                      caseFileId: charge.caseFileId ?? f.caseFileId,
                    }));
                  }
                }}
              >
                <option value="">— Anklage auswählen —</option>
                {charges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.citizenName} – {c.status}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelClass}>Urteilstyp *</label>
            <select
              className={inputClass}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as typeof form.type })}
            >
              <option value="GUILTY">Schuldig</option>
              <option value="NOT_GUILTY">Nicht schuldig</option>
              <option value="PLEA_DEAL">Geständnisvereinbarung</option>
              <option value="DISMISSED">Eingestellt</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Urteil / Strafe</label>
            <RichTextEditor
              value={form.sentence}
              onChange={(v) => setForm({ ...form, sentence: v })}
              placeholder="Beschreibung des Urteils"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Case file dropdown */}
          <div>
            <label className={labelClass}>Parteiakte verknüpfen</label>
            <select
              className={inputClass}
              value={form.caseFileId}
              onChange={(e) => setForm({ ...form, caseFileId: e.target.value })}
            >
              <option value="">— Keine Parteiakte —</option>
              {caseFiles.map((cf) => (
                <option key={cf.id} value={cf.id}>
                  {cf.caseNumber} – {cf.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Notizen</label>
            <RichTextEditor
              value={form.notes}
              onChange={(v) => setForm({ ...form, notes: v })}
              placeholder="Weitere Anmerkungen"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/verdicts"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Urteil erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

