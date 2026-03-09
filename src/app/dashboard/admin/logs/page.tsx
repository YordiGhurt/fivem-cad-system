import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

const actionLabels: Record<string, string> = {
  USER_CREATED: 'Benutzer erstellt',
  USER_UPDATED: 'Benutzer aktualisiert',
  USER_BANNED: 'Benutzer gesperrt',
  ORG_CREATED: 'Organisation erstellt',
  ORG_UPDATED: 'Organisation aktualisiert',
  PERMISSION_CHANGED: 'Berechtigung geändert',
  RANK_CREATED: 'Rang erstellt',
  RANK_UPDATED: 'Rang aktualisiert',
  DATA_DELETED: 'Daten gelöscht',
  SYSTEM_CONFIG: 'Systemkonfiguration',
};

interface SearchParams {
  page?: string;
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin-Log</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Einträge gesamt</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktion</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Beschreibung</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Ausführender</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Ziel</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Datum</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                  Keine Log-Einträge gefunden
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {actionLabels[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm max-w-64 truncate">{log.description}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{log.performedBy.username}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">
                    {log.targetType ? `${log.targetType}${log.targetId ? `:${log.targetId}` : ''}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss')}
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
                href={`/dashboard/admin/logs?page=${page - 1}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/admin/logs?page=${page + 1}`}
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
