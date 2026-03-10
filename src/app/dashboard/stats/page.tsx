import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BarChart2, Users, FileText, AlertTriangle, Radio } from 'lucide-react';

interface StatsData {
  incidents: {
    total: number;
    byStatus: { status: string; count: number }[];
    byPriority: { priority: number; count: number }[];
    perDay: { date: string; count: number }[];
  };
  units: {
    active: number;
    byStatus: { status: string; count: number }[];
  };
  citizens: { total: number };
  reports: { total: number };
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktiv',
  PENDING: 'Ausstehend',
  CLOSED: 'Geschlossen',
  CANCELLED: 'Abgebrochen',
};

const unitStatusLabels: Record<string, string> = {
  AVAILABLE: 'Verfügbar',
  BUSY: 'Beschäftigt',
  OFFDUTY: 'Außer Dienst',
  ONSCENE: 'Am Einsatzort',
  ENROUTE: 'Unterwegs',
  BREAK: 'Pause',
};

async function getStats(): Promise<StatsData | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const base = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const res = await fetch(`${base}/api/stats`, {
      headers: { Cookie: '' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export default async function StatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') {
    redirect('/dashboard');
  }

  const stats = await getStats();

  const maxDayCount = stats ? Math.max(...stats.incidents.perDay.map((d) => d.count), 1) : 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BarChart2 className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="text-white text-xl font-bold">Statistiken</h1>
          <p className="text-slate-400 text-sm">Auswertungen und Kennzahlen</p>
        </div>
      </div>

      {!stats ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">Keine Statistiken verfügbar</p>
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}
              label="Einsätze Gesamt"
              value={stats.incidents.total}
            />
            <StatCard
              icon={<Radio className="w-5 h-5 text-green-400" />}
              label="Aktive Einheiten"
              value={stats.units.active}
            />
            <StatCard
              icon={<Users className="w-5 h-5 text-blue-400" />}
              label="Bürger"
              value={stats.citizens.total}
            />
            <StatCard
              icon={<FileText className="w-5 h-5 text-purple-400" />}
              label="Berichte"
              value={stats.reports.total}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incidents by status */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 text-sm">Einsätze nach Status</h2>
              <div className="space-y-3">
                {stats.incidents.byStatus.map((s) => {
                  const pct = stats.incidents.total > 0
                    ? Math.round((s.count / stats.incidents.total) * 100)
                    : 0;
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{statusLabels[s.status] ?? s.status}</span>
                        <span className="text-slate-400">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Units by status */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-4 text-sm">Einheiten nach Status</h2>
              <div className="space-y-3">
                {stats.units.byStatus.map((s) => {
                  const total = stats.units.byStatus.reduce((a, b) => a + b.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={s.status}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300">{unitStatusLabels[s.status] ?? s.status}</span>
                        <span className="text-slate-400">{s.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Incidents last 7 days */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4 text-sm">Einsätze letzte 7 Tage</h2>

            {/* Bar chart */}
            <div className="flex items-end gap-1 h-24 mb-4">
              {stats.incidents.perDay.map((d) => {
                const height = maxDayCount > 0 ? Math.round((d.count / maxDayCount) * 100) : 0;
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-slate-500 text-[9px]">{d.count}</span>
                    <div className="w-full bg-slate-800 rounded-sm overflow-hidden flex-1 flex items-end">
                      <div
                        className="w-full bg-blue-500 rounded-sm transition-all"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-slate-600 text-[8px]">
                      {new Date(d.date).toLocaleDateString('de-DE', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-1.5">Datum</th>
                  <th className="text-right py-1.5">Einsätze</th>
                </tr>
              </thead>
              <tbody>
                {stats.incidents.perDay.map((d) => (
                  <tr key={d.date} className="border-b border-slate-800/50">
                    <td className="py-1.5 text-slate-300">
                      {new Date(d.date).toLocaleDateString('de-DE', {
                        weekday: 'short',
                        day: '2-digit',
                        month: '2-digit',
                      })}
                    </td>
                    <td className="py-1.5 text-right text-white font-medium">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-slate-400 text-xs">{label}</span>
      </div>
      <p className="text-white text-2xl font-bold">{value.toLocaleString('de-DE')}</p>
    </div>
  );
}
