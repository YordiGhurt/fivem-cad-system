'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type UnitStatus = 'AVAILABLE' | 'BUSY' | 'OFFDUTY' | 'ONSCENE' | 'ENROUTE' | 'BREAK';

const statusColors: Record<UnitStatus, string> = {
  AVAILABLE: 'bg-green-500/20 text-green-400 border border-green-500/30',
  BUSY: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  ONSCENE: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  OFFDUTY: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  ENROUTE: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  BREAK: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const statusDots: Record<UnitStatus, string> = {
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-yellow-500',
  ONSCENE: 'bg-orange-500',
  OFFDUTY: 'bg-slate-500',
  ENROUTE: 'bg-blue-500',
  BREAK: 'bg-purple-500',
};

const statusLabels: Record<UnitStatus, string> = {
  AVAILABLE: 'Verfügbar',
  BUSY: 'Beschäftigt',
  ONSCENE: 'Am Einsatzort',
  OFFDUTY: 'Außer Dienst',
  ENROUTE: 'Unterwegs',
  BREAK: 'Pause',
};

const allStatuses: UnitStatus[] = ['AVAILABLE', 'ENROUTE', 'ONSCENE', 'BUSY', 'BREAK', 'OFFDUTY'];

interface Props {
  unitId: string;
  currentStatus: UnitStatus;
  canChange: boolean;
}

export default function UnitStatusChanger({ unitId, currentStatus, canChange }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<UnitStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const changeStatus = async (newStatus: UnitStatus) => {
    if (!canChange || newStatus === status) {
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(false);
    try {
      const res = await fetch('/api/units/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const badge = (
    <span
      className={`text-xs px-2 py-1 rounded-full ${statusColors[status] ?? 'bg-slate-500/20 text-slate-400'} ${canChange && !loading ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={() => canChange && !loading && setOpen((v) => !v)}
      title={canChange ? 'Status ändern' : undefined}
    >
      {loading ? '…' : status}
    </span>
  );

  if (!canChange) return badge;

  return (
    <div className="relative inline-block">
      {badge}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl min-w-[140px]">
          {allStatuses.map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${s === status ? 'font-semibold text-white' : 'text-slate-300'}`}
            >
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${statusDots[s]}`} />
              {statusLabels[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
