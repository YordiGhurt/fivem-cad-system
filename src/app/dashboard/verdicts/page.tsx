import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

const verdictTypeLabels: Record<string, string> = {
  GUILTY: 'Schuldig',
  NOT_GUILTY: 'Nicht schuldig',
  PLEA_DEAL: 'Vergleich',
  DISMISSED: 'Abgewiesen',
};

const verdictTypeColors: Record<string, string> = {
  GUILTY: 'bg-red-500/20 text-red-400 border border-red-500/30',
  NOT_GUILTY: 'bg-green-500/20 text-green-400 border border-green-500/30',
  PLEA_DEAL: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  DISMISSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

interface SearchParams {
  type?: string;
  search?: string;
  page?: string;
}

export default async function VerdictsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN';
  const canCreate = role === 'ADMIN' || role === 'SUPERVISOR';

  const sp = await searchParams;
  const type = sp.type;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { citizenName: { contains: search, mode: 'insensitive' } },
      { caseNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [verdicts, total] = await Promise.all([
    prisma.verdict.findMany({
      where,
      include: { judge: { select: { id: true, username: true } } },
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.verdict.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Urteile</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Urteile gesamt</p>
        </div>
        {canCreate && (
          <Link
            href="/dashboard/verdicts/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Neues Urteil
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Bürger, Fallnummer..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            name="type"
            defaultValue={type ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Typen</option>
            <option value="GUILTY">Schuldig</option>
            <option value="NOT_GUILTY">Nicht schuldig</option>
            <option value="PLEA_DEAL">Vergleich</option>
            <option value="DISMISSED">Abgewiesen</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(search || type) && (
            <Link
              href="/dashboard/verdicts"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Fallnummer</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Bürger</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Urteil</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Haftzeit (Mo.)</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Geldstrafe</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Richter</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Datum</th>
              {isAdmin && <th className="px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {verdicts.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-slate-500">
                  Keine Urteile gefunden
                </td>
              </tr>
            ) : (
              verdicts.map((verdict) => (
                <tr key={verdict.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-sm">{verdict.caseNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{verdict.citizenName}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${verdictTypeColors[verdict.type] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {verdictTypeLabels[verdict.type] ?? verdict.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{verdict.jailTime ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {verdict.fineAmount != null ? `$${verdict.fineAmount.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{verdict.judge.username}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(verdict.issuedAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <DeleteButton id={verdict.id} endpoint="/api/verdicts" />
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
                href={`/dashboard/verdicts?page=${page - 1}${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/verdicts?page=${page + 1}${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`}
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
