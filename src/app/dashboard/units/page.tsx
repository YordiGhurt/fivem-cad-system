import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500/20 text-green-400 border border-green-500/30',
  BUSY: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  ONSCENE: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  OFFDUTY: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  ENROUTE: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  BREAK: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const statusDots: Record<string, string> = {
  AVAILABLE: 'bg-green-500',
  BUSY: 'bg-yellow-500',
  ONSCENE: 'bg-orange-500',
  OFFDUTY: 'bg-slate-500',
  ENROUTE: 'bg-blue-500',
  BREAK: 'bg-purple-500',
};

interface SearchParams {
  status?: string;
  orgId?: string;
}

export default async function UnitsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  const sp = await searchParams;
  const status = sp.status;
  const orgId = sp.orgId;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (orgId) where.organizationId = orgId;

  const [units, organizations] = await Promise.all([
    prisma.unit.findMany({
      where,
      include: { user: true, organization: true },
      orderBy: [{ status: 'asc' }, { callsign: 'asc' }],
    }),
    prisma.organization.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const statusGroups = ['AVAILABLE', 'ENROUTE', 'ONSCENE', 'BUSY', 'BREAK', 'OFFDUTY'];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Einheiten</h1>
          <p className="text-slate-400 text-sm mt-1">{units.length} Einheiten gesamt</p>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {statusGroups.map((s) => {
          const count = units.filter((u) => u.status === s).length;
          return (
            <div key={s} className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
              <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-2 ${statusDots[s] ?? 'bg-slate-500'}`} />
              <p className="text-white text-xl font-bold">{count}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <select
            name="status"
            defaultValue={status ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Status</option>
            {statusGroups.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            name="orgId"
            defaultValue={orgId ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Organisationen</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Rufzeichen</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Benutzer</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Organisation</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktualisiert</th>
            </tr>
          </thead>
          <tbody>
            {units.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  Keine Einheiten gefunden
                </td>
              </tr>
            ) : (
              units.map((unit) => (
                <tr key={unit.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[unit.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {unit.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{unit.callsign}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{unit.user.username}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: unit.organization.color + '22',
                        color: unit.organization.color,
                      }}
                    >
                      {unit.organization.callsign}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(unit.updatedAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
