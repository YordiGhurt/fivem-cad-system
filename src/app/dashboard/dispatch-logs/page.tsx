import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

interface SearchParams {
  organizationId?: string;
  page?: string;
}

export default async function DispatchLogsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  const sp = await searchParams;
  const organizationId = sp.organizationId ?? (session?.user?.organizationId ?? undefined);
  const isAdmin = session?.user?.role === 'ADMIN';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;

  const [logs, total] = await Promise.all([
    prisma.dispatchLog.findMany({
      where,
      include: {
        dispatcher: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dispatchLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Schichtbuch</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Schichteinträge gesamt</p>
        </div>
        <Link
          href="/dashboard/dispatch-logs/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neue Schicht
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Lognummer</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Disponent</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Organisation</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Schichtbeginn</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Schichtende</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Einsätze</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Erstellt</th>
              {isAdmin && <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-slate-500">
                  Keine Schichteinträge gefunden
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-sm">{log.logNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{log.dispatcher.username}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{log.organization.callsign}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {format(new Date(log.shiftStart), 'dd.MM.yyyy HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {log.shiftEnd ? format(new Date(log.shiftEnd), 'dd.MM.yyyy HH:mm') : (
                      <span className="text-green-400 text-xs">Aktiv</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{log.callsHandled}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <DeleteButton id={log.id} endpoint="/api/dispatch-logs" />
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            Seite {page} von {totalPages} · {total} Einträge
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/dispatch-logs?page=${page - 1}${organizationId ? `&organizationId=${organizationId}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/dispatch-logs?page=${page + 1}${organizationId ? `&organizationId=${organizationId}` : ''}`}
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
