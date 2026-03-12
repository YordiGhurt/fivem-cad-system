'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Unit {
  id: string;
  callsign: string;
  status: string;
}

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500/20 text-green-400 border border-green-500/30',
  BUSY: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  ONSCENE: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  ENROUTE: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  BREAK: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  OFFDUTY: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const statusLabels: Record<string, string> = {
  AVAILABLE: 'Verfügbar',
  BUSY: 'Beschäftigt',
  ONSCENE: 'Am Einsatzort',
  ENROUTE: 'Unterwegs',
  BREAK: 'Pause',
  OFFDUTY: 'Außer Dienst',
};

export default function MyUnitWidget() {
  const { data: session } = useSession();
  const [unit, setUnit] = useState<Unit | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchUnit = () => {
      fetch(`/api/units?userId=${session.user.id}`)
        .then((r) => r.json())
        .then((d) => {
          const units: Unit[] = d.data ?? [];
          const active = units.find((u) => u.status !== 'OFFDUTY') ?? units[0] ?? null;
          setUnit(active);
        })
        .catch(() => {});
    };

    fetchUnit();
    const interval = setInterval(fetchUnit, 30_000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  if (!unit) {
    return (
      <Link
        href="/dashboard/units"
        className="text-slate-500 text-xs hover:text-slate-400 transition-colors"
      >
        Keine Einheit
      </Link>
    );
  }

  return (
    <Link href="/dashboard/units" className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[unit.status] ?? statusColors.OFFDUTY}`}>
        {unit.callsign}
      </span>
      <span className="text-slate-400 text-xs hidden sm:block">
        {statusLabels[unit.status] ?? unit.status}
      </span>
    </Link>
  );
}
