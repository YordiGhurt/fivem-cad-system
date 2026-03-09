import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

const categoryLabels: Record<string, string> = {
  CRIMINAL: 'Strafrecht',
  CIVIL: 'Zivilrecht',
  TRAFFIC: 'Verkehrsrecht',
  ADMINISTRATIVE: 'Verwaltungsrecht',
};

const categoryColors: Record<string, string> = {
  CRIMINAL: 'bg-red-500/20 text-red-400 border border-red-500/30',
  CIVIL: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  TRAFFIC: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  ADMINISTRATIVE: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

interface SearchParams {
  category?: string;
  search?: string;
  page?: string;
}

export default async function LawsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'ADMIN';

  const sp = await searchParams;
  const category = sp.category;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [laws, total] = await Promise.all([
    prisma.law.findMany({
      where,
      include: { createdBy: { select: { id: true, username: true } } },
      orderBy: { code: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.law.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gesetze</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Gesetze gesamt</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/laws/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Neues Gesetz
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Code, Titel..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            name="category"
            defaultValue={category ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Kategorien</option>
            <option value="CRIMINAL">Strafrecht</option>
            <option value="CIVIL">Zivilrecht</option>
            <option value="TRAFFIC">Verkehrsrecht</option>
            <option value="ADMINISTRATIVE">Verwaltungsrecht</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(search || category) && (
            <Link
              href="/dashboard/laws"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Code</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Titel</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Kategorie</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Strafe</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Geldstrafe</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Haftzeit (Mo.)</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Erstellt</th>
              {isAdmin && <th className="px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {laws.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-slate-500">
                  Keine Gesetze gefunden
                </td>
              </tr>
            ) : (
              laws.map((law) => (
                <tr key={law.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono font-medium">{law.code}</td>
                  <td className="px-4 py-3 text-white">{law.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[law.category] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {categoryLabels[law.category] ?? law.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm max-w-40 truncate">{law.penalty ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {law.fineAmount != null ? `$${law.fineAmount.toLocaleString()}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{law.jailTime ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${law.active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                      {law.active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(law.createdAt), 'dd.MM.yyyy')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <DeleteButton id={law.id} endpoint="/api/laws" />
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
                href={`/dashboard/laws?page=${page - 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/laws?page=${page + 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
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
