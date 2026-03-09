import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { AdminLogAction } from '@prisma/client';

const actionLabels: Record<AdminLogAction, string> = {
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

const actionColors: Record<AdminLogAction, string> = {
  USER_CREATED: 'bg-green-500/20 text-green-400',
  USER_UPDATED: 'bg-blue-500/20 text-blue-400',
  USER_BANNED: 'bg-red-500/20 text-red-400',
  ORG_CREATED: 'bg-green-500/20 text-green-400',
  ORG_UPDATED: 'bg-blue-500/20 text-blue-400',
  PERMISSION_CHANGED: 'bg-yellow-500/20 text-yellow-400',
  RANK_CREATED: 'bg-green-500/20 text-green-400',
  RANK_UPDATED: 'bg-blue-500/20 text-blue-400',
  DATA_DELETED: 'bg-red-500/20 text-red-400',
  SYSTEM_CONFIG: 'bg-purple-500/20 text-purple-400',
};

interface SearchParams {
  action?: string;
  search?: string;
  page?: string;
}

export default async function AdminLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') redirect('/dashboard');

  const sp = await searchParams;
  const action = sp.action as AdminLogAction | undefined;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 50;

  const where: Record<string, unknown> = {};
  if (action && Object.values(AdminLogAction).includes(action)) {
    where.action = action;
  }
  if (search) {
    where.description = { contains: search, mode: 'insensitive' };
  }

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      include: { performedBy: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.adminLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { action, search: search || undefined, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    return params.toString() ? `?${params.toString()}` : '';
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin-Log</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Einträge gesamt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            type="search"
            defaultValue={search}
            placeholder="Beschreibung suchen…"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-64"
          />
          <select
            name="action"
            defaultValue={action ?? ''}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="">Alle Aktionen</option>
            {Object.keys(actionLabels).map((a) => (
              <option key={a} value={a}>
                {actionLabels[a as AdminLogAction]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(action || search) && (
            <Link
              href="/dashboard/admin-log"
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Zurücksetzen
            </Link>
          )}
        </form>
      </div>

      {/* Empty state info */}
      {total === 0 && !action && !search && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-blue-400 text-lg flex-shrink-0">ℹ️</span>
          <p className="text-blue-300 text-sm">
            Noch keine Admin-Aktionen protokolliert. Logs werden automatisch erstellt sobald Aktionen im System stattfinden.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Zeitstempel
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Aktion
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Beschreibung
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Durchgeführt von
              </th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                Zielobjekt
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                  Keine Einträge gefunden
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm:ss')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${actionColors[log.action] ?? 'bg-slate-500/20 text-slate-400'}`}
                    >
                      {actionLabels[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm max-w-xs truncate">
                    {log.description}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {log.performedBy.username}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {log.targetId ? (
                      <span className="font-mono">{log.targetType ? `${log.targetType}: ` : ''}{log.targetId}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-slate-400">
          <span>
            Seite {page} von {totalPages} · {total} Einträge
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/admin-log${buildQuery({ page: String(page - 1) })}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                ← Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/admin-log${buildQuery({ page: String(page + 1) })}`}
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
