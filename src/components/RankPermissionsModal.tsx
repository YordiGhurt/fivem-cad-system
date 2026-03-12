'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export interface OrgRank {
  id: string;
  organizationId: string;
  name: string;
  level: number;
  color: string;
  permissions?: Record<string, boolean> | null;
  createdAt: string;
}

const permissionGroups: { label: string; keys: { key: string; label: string }[] }[] = [
  {
    label: 'Einsätze',
    keys: [
      { key: 'canViewIncidents', label: 'Einsätze ansehen' },
      { key: 'canCreateIncidents', label: 'Einsätze erstellen' },
      { key: 'canDeleteIncidents', label: 'Einsätze löschen' },
    ],
  },
  {
    label: 'Haftbefehle',
    keys: [
      { key: 'canViewWarrants', label: 'Haftbefehle ansehen' },
      { key: 'canCreateWarrants', label: 'Haftbefehle erstellen' },
      { key: 'canDeleteWarrants', label: 'Haftbefehle löschen' },
    ],
  },
  {
    label: 'Berichte',
    keys: [
      { key: 'canViewReports', label: 'Berichte ansehen' },
      { key: 'canCreateReports', label: 'Berichte erstellen' },
      { key: 'canDeleteReports', label: 'Berichte löschen' },
    ],
  },
  {
    label: 'Bürger & Fahrzeuge',
    keys: [
      { key: 'canViewCitizens', label: 'Bürger ansehen' },
      { key: 'canDeleteCitizens', label: 'Bürger löschen' },
      { key: 'canViewVehicles', label: 'Fahrzeuge ansehen' },
      { key: 'canManageUnits', label: 'Einheiten verwalten' },
    ],
  },
  {
    label: 'Gesetze',
    keys: [
      { key: 'canViewLaws', label: 'Gesetze ansehen' },
      { key: 'canCreateLaws', label: 'Gesetze erstellen' },
      { key: 'canDeleteLaws', label: 'Gesetze löschen' },
    ],
  },
  {
    label: 'Urteile & Anklagen',
    keys: [
      { key: 'canViewVerdicts', label: 'Urteile ansehen' },
      { key: 'canCreateVerdicts', label: 'Urteile erstellen' },
      { key: 'canDeleteVerdicts', label: 'Urteile löschen' },
      { key: 'canViewCharges', label: 'Anklagen ansehen' },
      { key: 'canCreateCharges', label: 'Anklagen erstellen' },
      { key: 'canDeleteCharges', label: 'Anklagen löschen' },
    ],
  },
  {
    label: 'Parteiakten',
    keys: [
      { key: 'canViewCaseFiles', label: 'Parteiakten ansehen' },
      { key: 'canCreateCaseFiles', label: 'Parteiakten erstellen' },
      { key: 'canDeleteCaseFiles', label: 'Parteiakten löschen' },
    ],
  },
  {
    label: 'Medizinische Akten',
    keys: [
      { key: 'canViewDeathCerts', label: 'Totenscheine ansehen' },
      { key: 'canCreateDeathCerts', label: 'Totenscheine erstellen' },
      { key: 'canDeleteDeathCerts', label: 'Totenscheine löschen' },
      { key: 'canViewMedicalRecords', label: 'Med. Akten ansehen' },
      { key: 'canCreateMedicalRecords', label: 'Med. Akten erstellen' },
      { key: 'canDeleteMedicalRecords', label: 'Med. Akten löschen' },
    ],
  },
  {
    label: 'Organisation',
    keys: [
      { key: 'canViewNews', label: 'News ansehen' },
      { key: 'canCreateNews', label: 'News erstellen' },
      { key: 'canDeleteNews', label: 'News löschen' },
      { key: 'canViewWarnings', label: 'Disziplinarakten ansehen' },
      { key: 'canCreateWarnings', label: 'Disziplinarakten erstellen' },
      { key: 'canDeleteWarnings', label: 'Disziplinarakten löschen' },
      { key: 'canViewTrainingRecords', label: 'Ausbildungsakten ansehen' },
      { key: 'canCreateTrainingRecords', label: 'Ausbildungsakten erstellen' },
      { key: 'canDeleteTrainingRecords', label: 'Ausbildungsakten löschen' },
      { key: 'canViewDispatchLog', label: 'Schichtbuch ansehen' },
      { key: 'canCreateDispatchLog', label: 'Schichtbuch erstellen' },
      { key: 'canDeleteDispatchLog', label: 'Schichtbuch-Einträge löschen' },
    ],
  },
  {
    label: 'Admin',
    keys: [
      { key: 'canViewAdminLog', label: 'Admin-Log ansehen' },
    ],
  },
];

interface Props {
  orgId: string;
  rank: OrgRank;
  readOnly?: boolean;
  onClose: () => void;
  onSave?: (updated: OrgRank) => void;
}

export default function RankPermissionsModal({ orgId, rank, readOnly = false, onClose, onSave }: Props) {
  const [perms, setPerms] = useState<Record<string, boolean>>(
    (rank.permissions as Record<string, boolean>) ?? {},
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggle = (key: string) => {
    if (readOnly) return;
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/organizations/${orgId}/ranks/${rank.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: perms }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      onSave?.(data);
      onClose();
    } catch {
      setError('Fehler beim Speichern der Berechtigungen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="p-5 border-b border-slate-800 flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Rang-Berechtigungen</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              {rank.name} (Lv. {rank.level})
              {readOnly && <span className="ml-2 text-slate-500">(nur lesen)</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-5 overflow-y-auto flex-1">
            {permissionGroups.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {group.keys.map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center justify-between group ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <span className={`text-slate-300 text-sm ${!readOnly ? 'group-hover:text-white transition-colors' : ''}`}>
                        {label}
                      </span>
                      <div
                        onClick={() => toggle(key)}
                        className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                          perms[key] ? 'bg-blue-600' : 'bg-slate-600'
                        } ${readOnly ? 'opacity-70' : 'cursor-pointer'}`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            perms[key] ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-xs px-5 pb-2">{error}</p>
          )}

          <div className="p-5 border-t border-slate-800 flex-shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {readOnly ? 'Schließen' : 'Abbrechen'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? 'Speichern…' : 'Speichern'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
