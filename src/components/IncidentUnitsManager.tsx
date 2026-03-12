'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, X } from 'lucide-react';

interface Unit {
  id: string;
  callsign: string;
  status: string;
  user: { username: string };
  organization: { callsign: string };
}

interface IncidentUnit {
  id: string;
  unitId: string;
  assignedAt: string;
  unit: Unit;
}

const unitStatusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-yellow-500',
  ONSCENE: 'bg-orange-500',
  OFFDUTY: 'bg-slate-500',
  ENROUTE: 'bg-blue-500',
  BREAK: 'bg-purple-500',
};

interface Props {
  incidentId: string;
  organizationId: string;
  initialUnits: IncidentUnit[];
}

export default function IncidentUnitsManager({ incidentId, organizationId, initialUnits }: Props) {
  const [units, setUnits] = useState<IncidentUnit[]>(initialUnits);
  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [error, setError] = useState('');

  const fetchAvailableUnits = useCallback(async () => {
    setLoadingUnits(true);
    try {
      const res = await fetch(`/api/units?organizationId=${organizationId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const allUnits: Unit[] = data.data ?? [];
      const assignedIds = new Set(units.map((u) => u.unitId));
      setAvailableUnits(
        allUnits.filter((u) => u.status !== 'OFFDUTY' && !assignedIds.has(u.id)),
      );
    } catch {
      setError('Fehler beim Laden der Einheiten');
    } finally {
      setLoadingUnits(false);
    }
  }, [organizationId, units]);

  useEffect(() => {
    if (showDropdown) {
      fetchAvailableUnits();
    }
  }, [showDropdown, fetchAvailableUnits]);

  const assignUnit = async (unitId: string) => {
    setError('');
    try {
      const res = await fetch(`/api/incidents/${incidentId}/units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Fehler beim Zuweisen');
        return;
      }
      const { data } = await res.json();
      setUnits((prev) => [...prev, data]);
      setShowDropdown(false);
    } catch {
      setError('Netzwerkfehler');
    }
  };

  const removeUnit = async (unitId: string) => {
    setError('');
    try {
      const res = await fetch(`/api/incidents/${incidentId}/units`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId }),
      });
      if (!res.ok) {
        setError('Fehler beim Entfernen');
        return;
      }
      setUnits((prev) => prev.filter((u) => u.unitId !== unitId));
    } catch {
      setError('Netzwerkfehler');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-400 text-xs font-medium uppercase">
          Zugewiesene Einheiten ({units.length})
        </h3>
        <button
          onClick={() => setShowDropdown((v) => !v)}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Hinzufügen
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs mb-2">{error}</p>
      )}

      {showDropdown && (
        <div className="mb-3 bg-slate-800 rounded-lg p-2">
          {loadingUnits ? (
            <p className="text-slate-500 text-xs p-2">Lade Einheiten…</p>
          ) : availableUnits.length === 0 ? (
            <p className="text-slate-500 text-xs p-2">Keine verfügbaren Einheiten</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {availableUnits.map((unit) => (
                <button
                  key={unit.id}
                  onClick={() => assignUnit(unit.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 transition-colors text-left"
                >
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${unitStatusColors[unit.status] ?? 'bg-slate-500'}`}
                  />
                  <span className="text-white text-sm flex-1">{unit.callsign}</span>
                  <span className="text-slate-500 text-xs">{unit.user.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {units.length === 0 ? (
        <p className="text-slate-500 text-xs">Keine Einheiten zugewiesen</p>
      ) : (
        <div className="space-y-2">
          {units.map((iu) => (
            <div key={iu.id} className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${unitStatusColors[iu.unit.status] ?? 'bg-slate-500'}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm">{iu.unit.callsign}</p>
                <p className="text-slate-400 text-xs">
                  {iu.unit.user.username} · {iu.unit.organization.callsign}
                </p>
              </div>
              <span className="text-xs text-slate-500">{iu.unit.status}</span>
              <button
                onClick={() => removeUnit(iu.unitId)}
                className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0"
                title="Einheit entfernen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
