import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';

const typeColors: Record<string, string> = {
  INCIDENT: 'bg-blue-500/20 text-blue-400',
  ARREST: 'bg-red-500/20 text-red-400',
  WARRANT: 'bg-orange-500/20 text-orange-400',
  MEDICAL: 'bg-green-500/20 text-green-400',
  CUSTOM: 'bg-slate-500/20 text-slate-400',
};

interface SearchParams {
  page?: string;
  type?: string;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  const sp = await searchParams;
  const page = parseInt(sp.page ?? '1');
  const type = sp.type;
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: { author: true, incident: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.report.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Berichte</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Berichte gesamt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <select
            name="type"
            defaultValue={type ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Typen</option>
            <option value="INCIDENT">Einsatz</option>
            <option value="ARREST">Verhaftung</option>
            <option value="WARRANT">Haftbefehl</option>
            <option value="MEDICAL">Medizinisch</option>
            <option value="CUSTOM">Sonstiges</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {type && (
            <Link
              href="/dashboard/reports"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Titel</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Typ</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Autor</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Einsatz</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">PDF</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  Keine Berichte gefunden
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {report.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${typeColors[report.type] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{report.author.username}</td>
                  <td className="px-4 py-3">
                    {report.incident ? (
                      <Link
                        href={`/dashboard/incidents/${report.incident.id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-mono"
                      >
                        {report.incident.caseNumber}
                      </Link>
                    ) : (
                      <span className="text-slate-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {report.pdfUrl ? (
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full hover:bg-green-500/30 transition-colors"
                      >
                        PDF
                      </a>
                    ) : (
                      <span className="text-slate-500 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm')}
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
                href={`/dashboard/reports?page=${page - 1}${type ? `&type=${type}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/reports?page=${page + 1}${type ? `&type=${type}` : ''}`}
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
