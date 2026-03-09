'use client';

import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Pencil,
  Trash2,
  Lock,
  X,
  Layers,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'ADMIN' | 'SUPERVISOR' | 'OFFICER' | 'DISPATCHER' | 'USER';
type OrgType = 'POLICE' | 'FIRE' | 'AMBULANCE' | 'DOJ' | 'CUSTOM';

export interface OrgPermission {
  canViewIncidents: boolean;
  canCreateIncidents: boolean;
  canViewWarrants: boolean;
  canCreateWarrants: boolean;
  canViewReports: boolean;
  canCreateReports: boolean;
  canViewCitizens: boolean;
  canViewVehicles: boolean;
  canManageUnits: boolean;
  canViewLaws: boolean;
  canCreateLaws: boolean;
  canViewVerdicts: boolean;
  canCreateVerdicts: boolean;
  canViewCharges: boolean;
  canCreateCharges: boolean;
  canViewCaseFiles: boolean;
  canCreateCaseFiles: boolean;
  canViewDeathCerts: boolean;
  canCreateDeathCerts: boolean;
  canViewMedicalRecords: boolean;
  canCreateMedicalRecords: boolean;
  canViewAdminLog: boolean;
  canViewNews: boolean;
  canCreateNews: boolean;
  canViewWarnings: boolean;
  canCreateWarnings: boolean;
  canViewTrainingRecords: boolean;
  canCreateTrainingRecords: boolean;
  canViewDispatchLog: boolean;
  canCreateDispatchLog: boolean;
  canDeleteIncidents: boolean;
  canDeleteWarrants: boolean;
  canDeleteReports: boolean;
  canDeleteCitizens: boolean;
  canDeleteLaws: boolean;
  canDeleteVerdicts: boolean;
  canDeleteCharges: boolean;
  canDeleteCaseFiles: boolean;
  canDeleteDeathCerts: boolean;
  canDeleteMedicalRecords: boolean;
  canDeleteNews: boolean;
  canDeleteWarnings: boolean;
  canDeleteTrainingRecords: boolean;
  canDeleteDispatchLog: boolean;
}

export interface OrgRank {
  id: string;
  organizationId: string;
  name: string;
  level: number;
  color: string;
  permissions?: Record<string, boolean> | null;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  type: OrgType;
  callsign: string;
  color: string;
  description?: string | null;
  active: boolean;
  permissions?: OrgPermission | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  organizationId?: string | null;
  organization?: { id: string; name: string; callsign: string; color: string } | null;
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  orgCount: number;
}

// ─── Style helpers ─────────────────────────────────────────────────────────────

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400 border border-red-500/30',
  SUPERVISOR: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  OFFICER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  DISPATCHER: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  USER: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const inputClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500';
const labelClass = 'block text-slate-400 text-xs font-medium uppercase mb-1.5';

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg {
  id: number;
  message: string;
  type: 'success' | 'error';
}

let toastCounter = 0;

function useToast() {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const show = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  return { toasts, show };
}

function ToastContainer({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[100]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all ${
            t.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          {t.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-sm">
        <p className="text-white font-medium mb-1">Bestätigung</p>
        <p className="text-slate-400 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Org Form Modal ───────────────────────────────────────────────────────────

interface OrgFormData {
  name: string;
  type: OrgType;
  callsign: string;
  color: string;
  description: string;
  active: boolean;
}

function OrgFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Organization;
  onClose: () => void;
  onSave: (data: OrgFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<OrgFormData>({
    name: initial?.name ?? '',
    type: initial?.type ?? 'POLICE',
    callsign: initial?.callsign ?? '',
    color: initial?.color ?? '#3b82f6',
    description: initial?.description ?? '',
    active: initial?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">
            {initial ? 'Fraktion bearbeiten' : 'Neue Fraktion erstellen'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Typ</label>
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as OrgType })}
              >
                {(['POLICE', 'FIRE', 'AMBULANCE', 'DOJ', 'CUSTOM'] as OrgType[]).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Rufzeichen</label>
              <input
                className={inputClass}
                value={form.callsign}
                onChange={(e) => setForm({ ...form, callsign: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Farbe</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-9 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
                <input
                  className={inputClass}
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            {initial && (
              <div className="flex items-end">
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
            )}
          </div>
          <div>
            <label className={labelClass}>Beschreibung</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Permissions Modal ────────────────────────────────────────────────────────

const permissionGroups: { label: string; keys: { key: keyof OrgPermission; label: string }[] }[] = [
  {
    label: 'Einsätze & Einheiten',
    keys: [
      { key: 'canViewIncidents', label: 'Einsätze ansehen' },
      { key: 'canCreateIncidents', label: 'Einsätze erstellen' },
      { key: 'canManageUnits', label: 'Einheiten verwalten' },
    ],
  },
  {
    label: 'Akten',
    keys: [
      { key: 'canViewReports', label: 'Berichte ansehen' },
      { key: 'canCreateReports', label: 'Berichte erstellen' },
      { key: 'canViewCaseFiles', label: 'Parteiakten ansehen' },
      { key: 'canCreateCaseFiles', label: 'Parteiakten erstellen' },
    ],
  },
  {
    label: 'Justiz',
    keys: [
      { key: 'canViewWarrants', label: 'Haftbefehle ansehen' },
      { key: 'canCreateWarrants', label: 'Haftbefehle erstellen' },
      { key: 'canViewLaws', label: 'Gesetze ansehen' },
      { key: 'canCreateLaws', label: 'Gesetze erstellen' },
      { key: 'canViewVerdicts', label: 'Urteile ansehen' },
      { key: 'canCreateVerdicts', label: 'Urteile erstellen' },
      { key: 'canViewCharges', label: 'Anklagen ansehen' },
      { key: 'canCreateCharges', label: 'Anklagen erstellen' },
    ],
  },
  {
    label: 'Bürger & Fahrzeuge',
    keys: [
      { key: 'canViewCitizens', label: 'Bürger ansehen' },
      { key: 'canViewVehicles', label: 'Fahrzeuge ansehen' },
    ],
  },
  {
    label: 'Medizin',
    keys: [
      { key: 'canViewDeathCerts', label: 'Totenscheine ansehen' },
      { key: 'canCreateDeathCerts', label: 'Totenscheine erstellen' },
      { key: 'canViewMedicalRecords', label: 'Med. Akten ansehen' },
      { key: 'canCreateMedicalRecords', label: 'Med. Akten erstellen' },
    ],
  },
  {
    label: 'Organisation',
    keys: [
      { key: 'canViewNews', label: 'News ansehen' },
      { key: 'canCreateNews', label: 'News erstellen' },
      { key: 'canViewWarnings', label: 'Disziplinarakten ansehen' },
      { key: 'canCreateWarnings', label: 'Disziplinarakten erstellen' },
      { key: 'canViewTrainingRecords', label: 'Ausbildungsakten ansehen' },
      { key: 'canCreateTrainingRecords', label: 'Ausbildungsakten erstellen' },
      { key: 'canViewDispatchLog', label: 'Schichtbuch ansehen' },
      { key: 'canCreateDispatchLog', label: 'Schichtbuch erstellen' },
    ],
  },
  {
    label: 'Admin',
    keys: [
      { key: 'canViewAdminLog', label: 'Admin-Log ansehen' },
    ],
  },
  {
    label: 'Löschen',
    keys: [
      { key: 'canDeleteIncidents', label: 'Einsätze löschen' },
      { key: 'canDeleteWarrants', label: 'Haftbefehle löschen' },
      { key: 'canDeleteReports', label: 'Berichte löschen' },
      { key: 'canDeleteCitizens', label: 'Bürger löschen' },
      { key: 'canDeleteLaws', label: 'Gesetze löschen' },
      { key: 'canDeleteVerdicts', label: 'Urteile löschen' },
      { key: 'canDeleteCharges', label: 'Anklagen löschen' },
      { key: 'canDeleteCaseFiles', label: 'Parteiakten löschen' },
      { key: 'canDeleteDeathCerts', label: 'Totenscheine löschen' },
      { key: 'canDeleteMedicalRecords', label: 'Med. Akten löschen' },
      { key: 'canDeleteNews', label: 'News löschen' },
      { key: 'canDeleteWarnings', label: 'Disziplinarakten löschen' },
      { key: 'canDeleteTrainingRecords', label: 'Ausbildungsakten löschen' },
      { key: 'canDeleteDispatchLog', label: 'Schichtbuch-Einträge löschen' },
    ],
  },
];

const permissionLabels: { key: keyof OrgPermission; label: string }[] = [
  { key: 'canViewIncidents', label: 'Einsätze ansehen' },
  { key: 'canCreateIncidents', label: 'Einsätze erstellen' },
  { key: 'canViewWarrants', label: 'Haftbefehle ansehen' },
  { key: 'canCreateWarrants', label: 'Haftbefehle erstellen' },
  { key: 'canViewReports', label: 'Berichte ansehen' },
  { key: 'canCreateReports', label: 'Berichte erstellen' },
  { key: 'canViewCitizens', label: 'Bürger ansehen' },
  { key: 'canViewVehicles', label: 'Fahrzeuge ansehen' },
  { key: 'canManageUnits', label: 'Einheiten verwalten' },
  { key: 'canViewLaws', label: 'Gesetze ansehen' },
  { key: 'canCreateLaws', label: 'Gesetze erstellen' },
  { key: 'canViewVerdicts', label: 'Urteile ansehen' },
  { key: 'canCreateVerdicts', label: 'Urteile erstellen' },
  { key: 'canViewCharges', label: 'Anklagen ansehen' },
  { key: 'canCreateCharges', label: 'Anklagen erstellen' },
  { key: 'canViewCaseFiles', label: 'Parteiakten ansehen' },
  { key: 'canCreateCaseFiles', label: 'Parteiakten erstellen' },
  { key: 'canViewDeathCerts', label: 'Totenscheine ansehen' },
  { key: 'canCreateDeathCerts', label: 'Totenscheine erstellen' },
  { key: 'canViewMedicalRecords', label: 'Med. Akten ansehen' },
  { key: 'canCreateMedicalRecords', label: 'Med. Akten erstellen' },
  { key: 'canViewAdminLog', label: 'Admin-Log ansehen' },
  { key: 'canViewNews', label: 'News ansehen' },
  { key: 'canCreateNews', label: 'News erstellen' },
  { key: 'canViewWarnings', label: 'Disziplinarakten ansehen' },
  { key: 'canCreateWarnings', label: 'Disziplinarakten erstellen' },
  { key: 'canViewTrainingRecords', label: 'Ausbildungsakten ansehen' },
  { key: 'canCreateTrainingRecords', label: 'Ausbildungsakten erstellen' },
  { key: 'canViewDispatchLog', label: 'Schichtbuch ansehen' },
  { key: 'canCreateDispatchLog', label: 'Schichtbuch erstellen' },
  { key: 'canDeleteIncidents', label: 'Einsätze löschen' },
  { key: 'canDeleteWarrants', label: 'Haftbefehle löschen' },
  { key: 'canDeleteReports', label: 'Berichte löschen' },
  { key: 'canDeleteCitizens', label: 'Bürger löschen' },
  { key: 'canDeleteLaws', label: 'Gesetze löschen' },
  { key: 'canDeleteVerdicts', label: 'Urteile löschen' },
  { key: 'canDeleteCharges', label: 'Anklagen löschen' },
  { key: 'canDeleteCaseFiles', label: 'Parteiakten löschen' },
  { key: 'canDeleteDeathCerts', label: 'Totenscheine löschen' },
  { key: 'canDeleteMedicalRecords', label: 'Med. Akten löschen' },
  { key: 'canDeleteNews', label: 'News löschen' },
  { key: 'canDeleteWarnings', label: 'Disziplinarakten löschen' },
  { key: 'canDeleteTrainingRecords', label: 'Ausbildungsakten löschen' },
  { key: 'canDeleteDispatchLog', label: 'Schichtbuch-Einträge löschen' },
];

const defaultPermissions: OrgPermission = {
  canViewIncidents: true,
  canCreateIncidents: false,
  canViewWarrants: false,
  canCreateWarrants: false,
  canViewReports: true,
  canCreateReports: false,
  canViewCitizens: false,
  canViewVehicles: false,
  canManageUnits: false,
  canViewLaws: false,
  canCreateLaws: false,
  canViewVerdicts: false,
  canCreateVerdicts: false,
  canViewCharges: false,
  canCreateCharges: false,
  canViewCaseFiles: false,
  canCreateCaseFiles: false,
  canViewDeathCerts: false,
  canCreateDeathCerts: false,
  canViewMedicalRecords: false,
  canCreateMedicalRecords: false,
  canViewAdminLog: false,
  canViewNews: true,
  canCreateNews: false,
  canViewWarnings: false,
  canCreateWarnings: false,
  canViewTrainingRecords: false,
  canCreateTrainingRecords: false,
  canViewDispatchLog: false,
  canCreateDispatchLog: false,
  canDeleteIncidents: false,
  canDeleteWarrants: false,
  canDeleteReports: false,
  canDeleteCitizens: false,
  canDeleteLaws: false,
  canDeleteVerdicts: false,
  canDeleteCharges: false,
  canDeleteCaseFiles: false,
  canDeleteDeathCerts: false,
  canDeleteMedicalRecords: false,
  canDeleteNews: false,
  canDeleteWarnings: false,
  canDeleteTrainingRecords: false,
  canDeleteDispatchLog: false,
};

function PermissionsModal({
  org,
  onClose,
  onSave,
}: {
  org: Organization;
  onClose: () => void;
  onSave: (perms: OrgPermission) => Promise<void>;
}) {
  const [perms, setPerms] = useState<OrgPermission>(org.permissions ?? defaultPermissions);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(perms);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex-shrink-0 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Berechtigungen</h3>
            <p className="text-slate-400 text-xs mt-0.5">{org.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Scrollable content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto flex-1">
            {permissionGroups.map((group) => (
              <div key={group.label} className="mb-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {group.label}
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {group.keys.map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer group">
                      <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                        {label}
                      </span>
                      <div
                        onClick={() => setPerms({ ...perms, [key]: !perms[key] })}
                        className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                          perms[key] ? 'bg-blue-600' : 'bg-slate-600'
                        }`}
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
          {/* Footer */}
          <div className="p-6 border-t border-slate-800 flex-shrink-0 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Rank Permissions Modal ───────────────────────────────────────────────────

function RankPermissionsModal({
  orgId,
  rank,
  onClose,
  onSave,
  showToast,
}: {
  orgId: string;
  rank: OrgRank;
  onClose: () => void;
  onSave: (updated: OrgRank) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [perms, setPerms] = useState<Record<string, boolean>>(
    (rank.permissions as Record<string, boolean>) ?? {}
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/ranks/${rank.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: perms }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      onSave(data);
    } catch {
      showToast('Fehler beim Speichern der Berechtigungen', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold">Rang-Berechtigungen</h3>
            <p className="text-slate-400 text-xs mt-0.5">{rank.name} (Lv. {rank.level})</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 mb-6">
            {permissionLabels.map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                  {label}
                </span>
                <div
                  onClick={() => setPerms({ ...perms, [key]: !perms[key] })}
                  className={`w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                    perms[key] ? 'bg-blue-600' : 'bg-slate-600'
                  }`}
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
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Speichern…' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Ranks Modal ──────────────────────────────────────────────────────────────

function RanksModal({
  org,
  onClose,
  showToast,
}: {
  org: Organization;
  onClose: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [ranks, setRanks] = useState<OrgRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newRank, setNewRank] = useState({ name: '', level: 1, color: '#94a3b8' });
  const [saving, setSaving] = useState(false);
  const [rankPermsTarget, setRankPermsTarget] = useState<OrgRank | null>(null);

  useEffect(() => {
    fetch(`/api/organizations/${org.id}/ranks`)
      .then((r) => r.json())
      .then((d) => setRanks(d.data ?? []))
      .catch(() => showToast('Fehler beim Laden der Ränge', 'error'))
      .finally(() => setLoading(false));
  }, [org.id, showToast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}/ranks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRank),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setRanks((prev) => [...prev, data].sort((a, b) => a.level - b.level));
      setNewRank({ name: '', level: 1, color: '#94a3b8' });
      setShowForm(false);
      showToast('Rang erstellt', 'success');
    } catch {
      showToast('Fehler beim Erstellen des Rangs', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rankId: string) => {
    try {
      const res = await fetch(`/api/organizations/${org.id}/ranks/${rankId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      setRanks((prev) => prev.filter((r) => r.id !== rankId));
      showToast('Rang gelöscht', 'success');
    } catch {
      showToast('Fehler beim Löschen des Rangs', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold">Ränge verwalten</h3>
            <p className="text-slate-400 text-xs mt-0.5">{org.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm py-4 text-center">Lädt…</p>
        ) : (
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {ranks.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Keine Ränge vorhanden</p>
            )}
            {ranks.map((rank) => (
              <div
                key={rank.id}
                className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rank.color }} />
                  <span className="text-white text-sm">{rank.name}</span>
                  <span className="text-slate-500 text-xs">Lv. {rank.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRankPermsTarget(rank)}
                    title="Berechtigungen bearbeiten"
                    className="text-slate-500 hover:text-blue-400 transition-colors"
                  >
                    <Shield className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rank.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm ? (
          <form onSubmit={handleCreate} className="border border-slate-700 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  className={inputClass}
                  value={newRank.name}
                  onChange={(e) => setNewRank({ ...newRank, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Level (1–100)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className={inputClass}
                  value={newRank.level}
                  onChange={(e) => setNewRank({ ...newRank, level: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Farbe</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-10 h-9 rounded-lg cursor-pointer bg-transparent border border-slate-700"
                  value={newRank.color}
                  onChange={(e) => setNewRank({ ...newRank, color: e.target.value })}
                />
                <input
                  className={inputClass}
                  value={newRank.color}
                  onChange={(e) => setNewRank({ ...newRank, color: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? 'Erstellen…' : 'Erstellen'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-400 rounded-xl py-2.5 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Rang
          </button>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>

      {rankPermsTarget && (
        <RankPermissionsModal
          orgId={org.id}
          rank={rankPermsTarget}
          onClose={() => setRankPermsTarget(null)}
          onSave={(updatedRank) => {
            setRanks((prev) => prev.map((r) => (r.id === updatedRank.id ? updatedRank : r)));
            setRankPermsTarget(null);
            showToast('Berechtigungen gespeichert', 'success');
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

// ─── User Form Modal ─────────────────────────────────────────────────────────

interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: Role;
  organizationId: string | null;
}

function UserFormModal({
  orgs,
  onClose,
  onSave,
}: {
  orgs: Organization[];
  onClose: () => void;
  onSave: (data: UserFormData) => Promise<void>;
}) {
  const [form, setForm] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    role: 'USER',
    organizationId: null,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-semibold">Neuen Benutzer erstellen</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Benutzername</label>
              <input
                className={inputClass}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelClass}>E-Mail</label>
              <input
                type="email"
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Passwort</label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rolle</label>
              <select
                className={inputClass}
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
              >
                {(['ADMIN', 'SUPERVISOR', 'OFFICER', 'DISPATCHER', 'USER'] as Role[]).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Organisation</label>
              <select
                className={inputClass}
                value={form.organizationId ?? ''}
                onChange={(e) =>
                  setForm({ ...form, organizationId: e.target.value || null })
                }
              >
                <option value="">— Keine —</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.callsign}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? 'Erstellen…' : 'Benutzer erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────

export default function AdminPanel({
  initialUsers,
  initialOrgs,
  stats: initialStats,
}: {
  initialUsers: User[];
  initialOrgs: Organization[];
  stats: Stats;
}) {
  const { toasts, show: showToast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [orgs, setOrgs] = useState(initialOrgs);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.active).length,
    adminCount: users.filter((u) => u.role === 'ADMIN').length,
    orgCount: orgs.length,
  };

  // ── User modals state ───────────────────────────────────────────────────────
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  // ── Org modals state ────────────────────────────────────────────────────────
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null);
  const [permOrg, setPermOrg] = useState<Organization | null>(null);
  const [ranksOrg, setRanksOrg] = useState<Organization | null>(null);

  // ── Org CRUD handlers ───────────────────────────────────────────────────────
  const handleCreateOrg = useCallback(
    async (data: OrgFormData) => {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        showToast('Fehler beim Erstellen der Fraktion', 'error');
        return;
      }
      const { data: org } = await res.json();
      setOrgs((prev) => [...prev, org].sort((a, b) => a.name.localeCompare(b.name)));
      setCreateOrgOpen(false);
      showToast('Fraktion erstellt', 'success');
    },
    [showToast],
  );

  const handleEditOrg = useCallback(
    async (data: OrgFormData) => {
      if (!editOrg) return;
      const res = await fetch(`/api/organizations/${editOrg.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        showToast('Fehler beim Speichern', 'error');
        return;
      }
      const { data: updated } = await res.json();
      setOrgs((prev) =>
        prev.map((o) => (o.id === editOrg.id ? { ...o, ...updated } : o)),
      );
      setEditOrg(null);
      showToast('Fraktion aktualisiert', 'success');
    },
    [editOrg, showToast],
  );

  const handleDeleteOrg = useCallback(async () => {
    if (!deleteOrg) return;
    const res = await fetch(`/api/organizations/${deleteOrg.id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('Fehler beim Löschen – Fraktion hat ggf. noch Abhängigkeiten', 'error');
      setDeleteOrg(null);
      return;
    }
    setOrgs((prev) => prev.filter((o) => o.id !== deleteOrg.id));
    setDeleteOrg(null);
    showToast('Fraktion gelöscht', 'success');
  }, [deleteOrg, showToast]);

  const handleSavePermissions = useCallback(
    async (perms: OrgPermission) => {
      if (!permOrg) return;
      const res = await fetch(`/api/organizations/${permOrg.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(perms),
      });
      if (!res.ok) {
        showToast('Fehler beim Speichern der Berechtigungen', 'error');
        return;
      }
      const { data: saved } = await res.json();
      setOrgs((prev) =>
        prev.map((o) => (o.id === permOrg.id ? { ...o, permissions: saved } : o)),
      );
      setPermOrg(null);
      showToast('Berechtigungen gespeichert', 'success');
    },
    [permOrg, showToast],
  );

  // ── User CRUD handlers ──────────────────────────────────────────────────────
  const handleCreateUser = useCallback(
    async (data: {
      username: string;
      email: string;
      password: string;
      role: Role;
      organizationId: string | null;
    }) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        showToast(json.error ?? 'Fehler beim Erstellen des Benutzers', 'error');
        return;
      }
      const { data: newUser } = await res.json();
      setUsers((prev) => [newUser, ...prev]);
      setCreateUserOpen(false);
      showToast('Benutzer erstellt', 'success');
    },
    [showToast],
  );

  const handleDeleteUser = useCallback(async () => {
    if (!deleteUser) return;
    const res = await fetch(`/api/users/${deleteUser.id}`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('Fehler beim Löschen des Benutzers', 'error');
      setDeleteUser(null);
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    setDeleteUser(null);
    showToast('Benutzer gelöscht', 'success');
  }, [deleteUser, showToast]);

  // ── User patch helper ───────────────────────────────────────────────────────
  const patchUser = useCallback(
    async (userId: string, patch: Partial<Pick<User, 'role' | 'active' | 'organizationId'>>) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        showToast('Fehler beim Aktualisieren des Benutzers', 'error');
        return;
      }
      const { data: updated } = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
      showToast('Benutzer aktualisiert', 'success');
    },
    [showToast],
  );

  return (
    <>
      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Benutzer gesamt</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Aktive Benutzer</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{stats.activeUsers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Administratoren</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{stats.adminCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Organisationen</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{stats.orgCount}</p>
        </div>
      </div>

      {/* ── Users Table ───────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Benutzerverwaltung</h2>
          <button
            onClick={() => setCreateUserOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neuer Benutzer
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Benutzername
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                E-Mail
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Rolle
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Organisation
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Status
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Erstellt
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-white font-medium">{user.username}</td>
                <td className="px-4 py-3 text-slate-300 text-sm">{user.email}</td>
                {/* Role dropdown */}
                <td className="px-4 py-3">
                  <select
                    className="bg-transparent border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
                    value={user.role}
                    style={{ color: 'inherit' }}
                    onChange={(e) => patchUser(user.id, { role: e.target.value as Role })}
                  >
                    {(['ADMIN', 'SUPERVISOR', 'OFFICER', 'DISPATCHER', 'USER'] as Role[]).map(
                      (r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ),
                    )}
                  </select>
                </td>
                {/* Org dropdown */}
                <td className="px-4 py-3">
                  <select
                    className="bg-transparent border border-slate-700 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500 cursor-pointer max-w-[140px] text-slate-300"
                    value={user.organizationId ?? ''}
                    onChange={(e) =>
                      patchUser(user.id, {
                        organizationId: e.target.value || null,
                      })
                    }
                  >
                    <option value="">— Keine —</option>
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.callsign}
                      </option>
                    ))}
                  </select>
                </td>
                {/* Active toggle */}
                <td className="px-4 py-3">
                  <button
                    onClick={() => patchUser(user.id, { active: !user.active })}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      user.active
                        ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                        : 'bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30'
                    }`}
                  >
                    {user.active ? 'Aktiv' : 'Inaktiv'}
                  </button>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm')}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setDeleteUser(user)}
                    title="Löschen"
                    className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Organizations Table ───────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Organisationen</h2>
          <button
            onClick={() => setCreateOrgOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Neue Fraktion
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Name
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Rufzeichen
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Typ
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Farbe
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Status
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr
                key={org.id}
                className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-white font-medium">{org.name}</td>
                <td className="px-4 py-3 text-slate-300 text-sm font-mono">{org.callsign}</td>
                <td className="px-4 py-3 text-slate-400 text-sm">{org.type}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: org.color }}
                    />
                    <span className="text-slate-400 text-xs font-mono">{org.color}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {org.active ? (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">
                      Aktiv
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-1 rounded-full">
                      Inaktiv
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditOrg(org)}
                      title="Bearbeiten"
                      className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPermOrg(org)}
                      title="Berechtigungen"
                      className="text-slate-400 hover:text-blue-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setRanksOrg(org)}
                      title="Ränge"
                      className="text-slate-400 hover:text-purple-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteOrg(org)}
                      title="Löschen"
                      className="text-slate-400 hover:text-red-400 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      {createUserOpen && (
        <UserFormModal
          orgs={orgs}
          onClose={() => setCreateUserOpen(false)}
          onSave={handleCreateUser}
        />
      )}
      {deleteUser && (
        <ConfirmDialog
          message={`Benutzer „${deleteUser.username}" wirklich löschen?`}
          onConfirm={handleDeleteUser}
          onCancel={() => setDeleteUser(null)}
        />
      )}
      {createOrgOpen && (
        <OrgFormModal onClose={() => setCreateOrgOpen(false)} onSave={handleCreateOrg} />
      )}
      {editOrg && (
        <OrgFormModal
          initial={editOrg}
          onClose={() => setEditOrg(null)}
          onSave={handleEditOrg}
        />
      )}
      {deleteOrg && (
        <ConfirmDialog
          message={`Fraktion „${deleteOrg.name}" wirklich löschen?`}
          onConfirm={handleDeleteOrg}
          onCancel={() => setDeleteOrg(null)}
        />
      )}
      {permOrg && (
        <PermissionsModal
          org={permOrg}
          onClose={() => setPermOrg(null)}
          onSave={handleSavePermissions}
        />
      )}
      {ranksOrg && (
        <RanksModal
          org={ranksOrg}
          onClose={() => setRanksOrg(null)}
          showToast={showToast}
        />
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}
