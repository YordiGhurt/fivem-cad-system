import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const priorityColors: Record<number, string> = {
  1: 'border-red-500 bg-red-500/10',
  2: 'border-orange-500 bg-orange-500/10',
  3: 'border-yellow-500 bg-yellow-500/10',
  4: 'border-blue-500 bg-blue-500/10',
  5: 'border-slate-500 bg-slate-500/10',
};

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-yellow-500',
  ONSCENE: 'bg-orange-500',
  OFFDUTY: 'bg-slate-500',
  ENROUTE: 'bg-blue-500',
  BREAK: 'bg-purple-500',
};

export default async function DashboardPage() {
  await getServerSession(authOptions);

  const [activeIncidents, units] = await Promise.all([
    prisma.incident.findMany({
      where: { status: { in: ['ACTIVE', 'PENDING'] } },
      include: {
        organization: true,
        units: { include: { unit: { include: { user: true } } } },
        _count: { select: { notes: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    }),
    prisma.unit.findMany({
      where: { status: { not: 'OFFDUTY' } },
      include: { user: true, organization: true },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Dispatch Übersicht</h1>
        <Link
          href="/dashboard/incidents"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neuer Einsatz
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Aktive Einsätze</p>
          <p className="text-3xl font-bold text-white mt-1">
            {activeIncidents.filter((i) => i.status === 'ACTIVE').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Ausstehend</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">
            {activeIncidents.filter((i) => i.status === 'PENDING').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Einheiten im Dienst</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{units.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Verfügbare Einheiten</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">
            {units.filter((u) => u.status === 'AVAILABLE').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <h2 className="text-lg font-semibold text-white mb-3">Aktive Einsätze</h2>
          <div className="space-y-3">
            {activeIncidents.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
                Keine aktiven Einsätze
              </div>
            ) : (
              activeIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/dashboard/incidents/${incident.id}`}
                  className={`block bg-slate-900 border-l-4 rounded-xl p-4 hover:bg-slate-800 transition-colors ${priorityColors[incident.priority] ?? 'border-slate-500'}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          {incident.caseNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${incident.status === 'ACTIVE' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}
                        >
                          {incident.status}
                        </span>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                          P{incident.priority}
                        </span>
                      </div>
                      <p className="text-white font-medium mt-1">{incident.type}</p>
                      <p className="text-slate-400 text-sm">{incident.location}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500 text-xs">
                        {formatDistanceToNow(new Date(incident.createdAt), {
                          addSuffix: true,
                          locale: de,
                        })}
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        {incident.units.length} Einheit(en)
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Einheiten</h2>
          <div className="space-y-2">
            {units.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-500">
                Keine aktiven Einheiten
              </div>
            ) : (
              units.map((unit) => (
                <div key={unit.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColors[unit.status] ?? 'bg-slate-500'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">{unit.callsign}</p>
                      <p className="text-slate-400 text-xs truncate">
                        {unit.user.username} · {unit.organization.callsign}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">{unit.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
