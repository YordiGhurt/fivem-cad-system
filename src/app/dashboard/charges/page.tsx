import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

const chargeStatusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  ACTIVE: 'Aktiv',
  DISMISSED: 'Abgewiesen',
  SERVED: 'Verbüßt',
};

const chargeStatusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  ACTIVE: 'bg-red-500/20 text-red-400 border border-red-500/30',
  DISMISSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  SERVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

interface SearchParams {
  status?: string;
  search?: string;
  page?: string;
}

export default async function ChargesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

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
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [charges, total] = await Promise.all([
    prisma.charge.findMany({
      where,
      include: {
        issuedBy: { select: { id: true, username: true } },
        law: { select: { id: true, code: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.charge.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Anklagen</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Anklagen gesamt</p>
        </div>
        <Link
          href="/dashboard/charges/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neue Anklage
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Bürger, Beschreibung..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            name="status"
            defaultValue={status ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="PENDING">Ausstehend</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="DISMISSED">Abgewiesen</option>
            <option value="SERVED">Verbüßt</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(search || status) && (
            <Link
              href="/dashboard/charges"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Bürger</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Gesetz</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Beschreibung</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aussteller</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Datum</th>
              {isAdmin && <th className="px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {charges.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="px-4 py-12 text-center text-slate-500">
                  Keine Anklagen gefunden
                </td>
              </tr>
            ) : (
              charges.map((charge) => (
                <tr key={charge.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{charge.citizenName}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm font-mono">
                    {charge.law ? `${charge.law.code} – ${charge.law.title}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm max-w-48 truncate">{charge.description}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${chargeStatusColors[charge.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {chargeStatusLabels[charge.status] ?? charge.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{charge.issuedBy.username}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(charge.createdAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <DeleteButton id={charge.id} endpoint="/api/charges" />
                    </td>
                  )}
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
                href={`/dashboard/charges?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/charges?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
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
