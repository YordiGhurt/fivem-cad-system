import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-red-500/20 text-red-400 border border-red-500/30',
  EXPIRED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  SERVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

interface SearchParams {
  status?: string;
  search?: string;
  page?: string;
}

export default async function WarrantsPage({
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
      { citizenName: { contains: search, mode: 'insensitive' } },
      { citizenId: { contains: search, mode: 'insensitive' } },
      { reason: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [warrants, total] = await Promise.all([
    prisma.warrant.findMany({
      where,
      include: { issuedBy: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.warrant.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Haftbefehle</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Haftbefehle gesamt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Name, Bürger-ID, Grund..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            name="status"
            defaultValue={status ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="EXPIRED">Abgelaufen</option>
            <option value="SERVED">Vollstreckt</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(search || status) && (
            <Link
              href="/dashboard/warrants"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Name</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Bürger-ID</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Grund</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Anklagen</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Ausgestellt von</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Läuft ab</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {warrants.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Keine Haftbefehle gefunden
                </td>
              </tr>
            ) : (
              warrants.map((warrant) => (
                <tr key={warrant.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{warrant.citizenName}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm font-mono">
                    {warrant.citizenId ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm max-w-48 truncate">{warrant.reason}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm max-w-48 truncate">{warrant.charges}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[warrant.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {warrant.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{warrant.issuedBy.username}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {warrant.expiresAt ? format(new Date(warrant.expiresAt), 'dd.MM.yyyy') : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(warrant.createdAt), 'dd.MM.yyyy HH:mm')}
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
                href={`/dashboard/warrants?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/warrants?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
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
