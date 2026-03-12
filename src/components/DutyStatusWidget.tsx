'use client';

import { useState, useEffect } from 'react';
import { Radio, LogIn, LogOut as LogOutIcon } from 'lucide-react';

type UnitStatus = 'AVAILABLE' | 'BUSY' | 'OFFDUTY' | 'ONSCENE' | 'ENROUTE' | 'BREAK';

interface Unit {
  id: string;
  callsign: string;
  status: UnitStatus;
}

export default function DutyStatusWidget() {
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/units/my')
      .then((r) => r.json())
      .then((d) => {
        setUnit(d.data ?? null);
        // If already on duty, notify the bridge immediately
        if (d.data && d.data.status !== 'OFFDUTY') {
          notifyBridge(d.data.id, d.data.callsign);
        }
      })
      .catch(() => setUnit(null))
      .finally(() => setLoading(false));
  }, []);

  function notifyBridge(unitId: string, callsign: string) {
    fetch('https://fivem-cad-bridge/setUnitId', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitId, callsign }),
    }).catch(() => {
      // Silent: only works inside FiveM NUI
    });
  }

  async function setStatus(newStatus: UnitStatus) {
    if (!unit) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await fetch(`/api/units/${unit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated: Unit = data.data;
        setUnit(updated);
        if (newStatus !== 'OFFDUTY') {
          notifyBridge(updated.id, updated.callsign);
        }
      } else {
        setError('Statuswechsel fehlgeschlagen');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return null;
  if (!unit) return null;

  const onDuty = unit.status !== 'OFFDUTY';

  return (
    <div className="px-3 py-2 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <Radio className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-400 truncate">{unit.callsign}</span>
        <span
          className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
            onDuty ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-400'
          }`}
        >
          {onDuty ? 'Im Dienst' : 'Off Duty'}
        </span>
      </div>
      {error && (
        <p className="text-[10px] text-red-400 mb-1 px-1">{error}</p>
      )}
      {onDuty ? (
        <button
          onClick={() => setStatus('OFFDUTY')}
          disabled={updating}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-300 hover:bg-red-900/40 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <LogOutIcon className="w-3.5 h-3.5 flex-shrink-0" />
          Dienst abtreten
        </button>
      ) : (
        <button
          onClick={() => setStatus('AVAILABLE')}
          disabled={updating}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-700/30 text-green-400 hover:bg-green-700/50 transition-colors disabled:opacity-50"
        >
          <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
          Dienst antreten
        </button>
      )}
    </div>
  );
}
