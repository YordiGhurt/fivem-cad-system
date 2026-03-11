'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  callsign: string;
  type: string;
}

interface User {
  id: string;
  username: string;
}

const lspdModules = [
  { key: 'GA', label: 'GA – Grundausbildung' },
  { key: 'LT', label: 'LT – Leitstelle' },
  { key: 'TA', label: 'TA – Taktik' },
  { key: 'PA', label: 'PA – Patrouillenarbeit' },
  { key: 'LA', label: 'LA – Lageanalyse' },
  { key: 'VK', label: 'VK – Verkehrskontrolle' },
  { key: 'Codes', label: 'Codes' },
  { key: 'FlugG', label: 'FlugG – Flugschein' },
];

const emsModules = [
  { key: 'Erstversorgung', label: 'Erstversorgung' },
  { key: 'ErweiterteVersorgung', label: 'Erweiterte Versorgung' },
  { key: 'Notaufnahme', label: 'Notaufnahme' },
  { key: 'Leitstelle', label: 'Leitstelle' },
  { key: 'Fahrzeugeinweisung', label: 'Fahrzeugeinweisung' },
];

const dojModules = [
  { key: 'Strafrecht', label: 'Strafrecht' },
  { key: 'Zivilrecht', label: 'Zivilrecht' },
  { key: 'Verhandlungsfuehrung', label: 'Verhandlungsführung' },
  { key: 'Aktenverwaltung', label: 'Aktenverwaltung' },
];

function getModulesForOrg(orgType: string) {
  if (orgType === 'POLICE') return lspdModules;
  if (orgType === 'AMBULANCE' || orgType === 'FIRE') return emsModules;
  if (orgType === 'DOJ') return dojModules;
  return [];
}

export default function NewTrainingRecordPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState({
    traineeName: '',
    traineeId: '',
    trainerName: '',
    trainerId: '',
    organizationId: '',
    type: 'BASIC' as string,
    notes: '',
    passed: false,
    date: new Date().toISOString().split('T')[0],
  });
  const [modules, setModules] = useState<Record<string, boolean>>({});
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/organizations')
      .then((r) => r.json())
      .then((d) => {
        setOrgs(d.data ?? []);
        if (session?.user?.organizationId) {
          setForm((prev) => ({ ...prev, organizationId: session.user.organizationId! }));
          setModules({});
        }
      })
      .catch(() => {});
    fetch('/api/users?pageSize=200')
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .catch(() => {});
  }, [session?.user?.organizationId]);

  const selectedOrg = orgs.find((o) => o.id === form.organizationId);
  const availableModules = selectedOrg ? getModulesForOrg(selectedOrg.type) : [];

  const handleModuleChange = (key: string, checked: boolean) => {
    setModules((prev) => ({ ...prev, [key]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/training-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traineeName: form.traineeName,
          traineeId: form.traineeId || undefined,
          trainerName: form.trainerName,
          trainerId: form.trainerId || undefined,
          organizationId: form.organizationId,
          type: form.type,
          modules: Object.keys(modules).length > 0 ? modules : undefined,
          notes: form.notes || undefined,
          passed: form.passed,
          date: form.date,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
        return;
      }

      router.push('/dashboard/training-records');
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
          href="/dashboard/training-records"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück
        </Link>
        <h1 className="text-2xl font-bold text-white">Neue Ausbildungsakte</h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Auszubildender (Name) *</label>
              <input
                className={inputClass}
                value={form.traineeName}
                onChange={(e) => setForm({ ...form, traineeName: e.target.value })}
                placeholder="Vor- und Nachname"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Auszubildender (Account)</label>
              <select
                className={inputClass}
                value={form.traineeId}
                onChange={(e) => {
                  const found = users.find((user) => user.id === e.target.value);
                  setForm({ ...form, traineeId: e.target.value, traineeName: found ? found.username : form.traineeName });
                }}
              >
                <option value="">— Optionaler Account —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ausbilder (Name) *</label>
              <input
                className={inputClass}
                value={form.trainerName}
                onChange={(e) => setForm({ ...form, trainerName: e.target.value })}
                placeholder="Vor- und Nachname"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Ausbilder (Account)</label>
              <select
                className={inputClass}
                value={form.trainerId}
                onChange={(e) => {
                  const found = users.find((user) => user.id === e.target.value);
                  setForm({ ...form, trainerId: e.target.value, trainerName: found ? found.username : form.trainerName });
                }}
              >
                <option value="">— Optionaler Account —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Organisation *</label>
              <select
                className={inputClass}
                value={form.organizationId}
                onChange={(e) => {
                  setForm({ ...form, organizationId: e.target.value });
                  setModules({});
                }}
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
              <label className={labelClass}>Ausbildungstyp *</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="BASIC">Grundausbildung</option>
                <option value="ADVANCED">Fortgeschritten</option>
                <option value="SPECIALIST">Spezialausbildung</option>
                <option value="REFRESHER">Auffrischung</option>
                <option value="SUPERVISOR">Leitungsausbildung</option>
                <option value="CUSTOM">Sonstige</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Datum *</label>
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          {availableModules.length > 0 && (
            <div>
              <label className={labelClass}>Bestandene Module</label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                {availableModules.map((mod) => (
                  <label key={mod.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modules[mod.key] ?? false}
                      onChange={(e) => handleModuleChange(mod.key, e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600"
                    />
                    <span className="text-slate-300 text-sm">{mod.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={labelClass}>Notizen</label>
            <textarea
              className={`${inputClass} min-h-20 resize-y`}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Zusätzliche Anmerkungen zur Ausbildung"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                role="switch"
                aria-checked={form.passed}
                tabIndex={0}
                onClick={() => setForm({ ...form, passed: !form.passed })}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setForm({ ...form, passed: !form.passed });
                  }
                }}
                className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${
                  form.passed ? 'bg-green-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.passed ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
              <span className="text-slate-400 text-sm">Ausbildung bestanden</span>
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/training-records"
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Ausbildungsakte erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
