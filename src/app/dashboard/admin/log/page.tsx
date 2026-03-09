import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { format } from 'date-fns';

interface SearchParams {
  page?: string;
}

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="p-6">
        <p className="text-red-400">Zugriff verweigert – Nur für Administratoren.</p>
      </div>
    );
  }

  const sp = await searchParams;
  const page = parseInt(sp.page ?? '1');
  const pageSize = 50;

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      include: { performedBy: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminLog.count(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin-Log</h1>
        <p className="text-slate-400 text-sm mt-1">{total} Einträge gesamt</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Datum</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Benutzer</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktion</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Beschreibung</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 text-sm">
                  Keine Log-Einträge vorhanden
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3 text-white text-sm">
                    {log.performedBy?.username ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm max-w-lg truncate">
                    {log.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <span>Seite {page} von {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a
                href={`/dashboard/admin/log?page=${page - 1}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                ← Zurück
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/dashboard/admin/log?page=${page + 1}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                Weiter →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
