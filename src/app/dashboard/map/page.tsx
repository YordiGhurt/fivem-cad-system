'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

const IncidentMap = dynamic(() => import('@/components/IncidentMap'), { ssr: false });

interface Incident {
  id: string;
  caseNumber: string;
  type: string;
  location: string;
  status: string;
  priority: number;
  coordinates?: { lat: number; lng: number } | null;
}

const priorityLabels: Record<number, string> = {
  1: 'Kritisch',
  2: 'Hoch',
  3: 'Mittel',
  4: 'Niedrig',
  5: 'Info',
};

const priorityColors: Record<number, string> = {
  1: 'text-red-400 bg-red-400/10',
  2: 'text-orange-400 bg-orange-400/10',
  3: 'text-yellow-400 bg-yellow-400/10',
  4: 'text-blue-400 bg-blue-400/10',
  5: 'text-slate-400 bg-slate-700',
};

export default function MapPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/incidents?status=ACTIVE&pageSize=100')
      .then((r) => r.json())
      .then((d) => setIncidents(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const withCoords = incidents.filter((i) => i.coordinates?.lat && i.coordinates?.lng);

  return (
    <div className="flex flex-col h-full bg-slate-950">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <MapPin className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-white text-xl font-bold">Einsatzkarte</h1>
            <p className="text-slate-400 text-sm">Aktive Einsätze auf der Karte</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden min-h-0">
          {loading ? (
            <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center">
              <p className="text-slate-400">Karte wird geladen...</p>
            </div>
          ) : (
            <IncidentMap incidents={incidents} />
          )}
        </div>

        {/* Incident list */}
        <div className="w-72 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800">
            <h2 className="text-white text-sm font-semibold">
              Aktive Einsätze ({incidents.length})
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">{withCoords.length} mit Koordinaten</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {incidents.length === 0 ? (
              <div className="p-4 text-center">
                <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Keine aktiven Einsätze</p>
              </div>
            ) : (
              incidents.map((inc) => (
                <Link
                  key={inc.id}
                  href={`/dashboard/incidents/${inc.id}`}
                  className="block px-3 py-2.5 border-b border-slate-800 hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{inc.caseNumber}</p>
                      <p className="text-slate-400 text-xs truncate">{inc.type}</p>
                      <p className="text-slate-500 text-xs truncate">{inc.location}</p>
                    </div>
                    <span
                      className={clsx(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0',
                        priorityColors[inc.priority] ?? priorityColors[5],
                      )}
                    >
                      P{inc.priority}
                    </span>
                  </div>
                  {!inc.coordinates && (
                    <p className="text-slate-600 text-[10px] mt-0.5">Keine Koordinaten</p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
