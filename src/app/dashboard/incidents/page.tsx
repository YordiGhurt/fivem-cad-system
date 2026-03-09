import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-red-500/20 text-red-400 border border-red-500/30',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  CANCELLED: 'bg-slate-600/20 text-slate-500 border border-slate-600/30',
};

const priorityColors: Record<number, string> = {
  1: 'text-red-400 font-bold',
  2: 'text-orange-400 font-bold',
  3: 'text-yellow-400',
  4: 'text-blue-400',
  5: 'text-slate-400',
};

interface SearchParams {
  status?: string;
  search?: string;
  page?: string;
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  const sp = await searchParams;
  const status = sp.status;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { caseNumber: { contains: search, mode: 'insensitive' } },
      { type: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      include: {
        organization: true,
        _count: { select: { units: true, notes: true } },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incident.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Einsätze</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Einsätze gesamt</p>
        </div>
        <Link
          href="/dashboard/incidents/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neuer Einsatz
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Suche nach Fallnummer, Typ, Ort..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            name="status"
            defaultValue={status ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="PENDING">Ausstehend</option>
            <option value="CLOSED">Geschlossen</option>
            <option value="CANCELLED">Abgebrochen</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(search || status) && (
            <Link
              href="/dashboard/incidents"
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Zurücksetzen
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Fallnummer
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Typ
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Ort
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Priorität
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Status
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Organisation
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Einheiten
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Erstellt
              </th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  Keine Einsätze gefunden
                </td>
              </tr>
            ) : (
              incidents.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/incidents/${incident.id}`}
                      className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                    >
                      {incident.caseNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{incident.type}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{incident.location}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${priorityColors[incident.priority] ?? 'text-slate-400'}`}>
                      P{incident.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusColors[incident.status] ?? 'bg-slate-500/20 text-slate-400'}`}
                    >
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-1 rounded-full text-white"
                      style={{ backgroundColor: incident.organization.color + '33', color: incident.organization.color }}
                    >
                      {incident.organization.callsign}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {incident._count.units}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(incident.createdAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            Seite {page} von {totalPages} · {total} Einträge
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/incidents?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/incidents?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Weiter
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
