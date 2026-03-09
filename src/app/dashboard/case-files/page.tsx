import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

const caseFileStatusLabels: Record<string, string> = {
  OPEN: 'Offen',
  UNDER_REVIEW: 'In Bearbeitung',
  CLOSED: 'Geschlossen',
  ARCHIVED: 'Archiviert',
};

const caseFileStatusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  ARCHIVED: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

interface SearchParams {
  status?: string;
  search?: string;
  page?: string;
}

export default async function CaseFilesPage({
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
      { title: { contains: search, mode: 'insensitive' } },
      { caseNumber: { contains: search, mode: 'insensitive' } },
      { citizenName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [caseFiles, total] = await Promise.all([
    prisma.caseFile.findMany({
      where,
      include: {
        createdBy: { select: { id: true, username: true } },
        assignedTo: { select: { id: true, username: true } },
        _count: { select: { charges: true, verdicts: true, documents: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.caseFile.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Parteiakten</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Akten gesamt</p>
        </div>
        <Link
          href="/dashboard/case-files/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neue Parteiakte
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Titel, Fallnummer, Bürger..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <select
            name="status"
            defaultValue={status ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Status</option>
            <option value="OPEN">Offen</option>
            <option value="UNDER_REVIEW">In Bearbeitung</option>
            <option value="CLOSED">Geschlossen</option>
            <option value="ARCHIVED">Archiviert</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(search || status) && (
            <Link
              href="/dashboard/case-files"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Titel</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Bürger</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Zuständig</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Anklagen</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Erstellt</th>
              {isAdmin && <th className="px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {caseFiles.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-slate-500">
                  Keine Parteiakten gefunden
                </td>
              </tr>
            ) : (
              caseFiles.map((cf) => (
                <tr key={cf.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-sm">{cf.caseNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{cf.title}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${caseFileStatusColors[cf.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {caseFileStatusLabels[cf.status] ?? cf.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{cf.citizenName ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{cf.assignedTo?.username ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{cf._count.charges}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(cf.createdAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-center">
                      <DeleteButton id={cf.id} endpoint="/api/case-files" />
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
                href={`/dashboard/case-files?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/case-files?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
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
