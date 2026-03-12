import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';

const categoryColors: Record<string, string> = {
  'Verbrechen': 'bg-red-500/20 text-red-400 border border-red-500/30',
  'Vergehen': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  'Ordnungswidrigkeit': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
};

interface SearchParams {
  category?: string;
  search?: string;
  page?: string;
}

export default async function FineCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  const sp = await searchParams;
  const category = sp.category;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 30;
  const isAdmin = session?.user?.role === 'ADMIN';
  const canEdit = isAdmin || session?.user?.role === 'SUPERVISOR';

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { offense: { contains: search, mode: 'insensitive' } },
      { legalSection: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [entries, total] = await Promise.all([
    prisma.fineEntry.findMany({
      where,
      orderBy: [{ category: 'asc' }, { offense: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.fineEntry.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bußgeldkatalog</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Einträge gesamt</p>
        </div>
        {isAdmin && (
          <Link
            href="/dashboard/fine-catalog/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            + Neuer Eintrag
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Delikt oder Paragraph suchen…"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
          <select
            name="category"
            defaultValue={category ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Kategorien</option>
            <option value="Verbrechen">Verbrechen</option>
            <option value="Vergehen">Vergehen</option>
            <option value="Ordnungswidrigkeit">Ordnungswidrigkeit</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(category || search) && (
            <Link
              href="/dashboard/fine-catalog"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Delikt</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Kategorie</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Paragraph</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Geldstrafe</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Haftzeit</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Beschlagnahmung</th>
              {canEdit && <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktion</th>}
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                  Keine Einträge gefunden
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-medium text-sm">{entry.offense}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[entry.category] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm font-mono">{entry.legalSection}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    ${entry.fineMin.toLocaleString('de-DE')} – ${entry.fineMax.toLocaleString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {entry.jailMin === 0 && entry.jailMax === 0
                      ? '—'
                      : `${entry.jailMin}–${entry.jailMax} Mon.`}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs max-w-48 truncate">
                    {entry.seizure ?? '—'}
                  </td>
                  {canEdit && (
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/fine-catalog/${entry.id}/edit`}
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors"
                      >
                        Bearbeiten
                      </Link>
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
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <span>Seite {page} von {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/fine-catalog?page=${page - 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                ← Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/fine-catalog?page=${page + 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Weiter →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
