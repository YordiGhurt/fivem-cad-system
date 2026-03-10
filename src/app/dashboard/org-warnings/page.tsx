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

const severityLabels: Record<string, { label: string; cls: string }> = {
  MINOR: { label: 'Leicht', cls: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' },
  MAJOR: { label: 'Schwer', cls: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
  FINAL: { label: 'Final', cls: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

export default async function OrgWarningsPage({
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

  const [warnings, total] = await Promise.all([
    prisma.orgWarning.findMany({
      where,
      include: {
        targetUser: { select: { id: true, username: true } },
        issuedBy: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.orgWarning.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Disziplinarakte</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Abmahnungen gesamt</p>
        </div>
        <Link
          href="/dashboard/org-warnings/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neue Abmahnung
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Titel</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Betroffener</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Schwere</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Ausgestellt von</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Organisation</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Datum</th>
              {isAdmin && <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {warnings.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-slate-500">
                  Keine Abmahnungen gefunden
                </td>
              </tr>
            ) : (
              warnings.map((w) => {
                const sev = severityLabels[w.severity] ?? severityLabels.MINOR;
                return (
                  <tr key={w.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{w.title}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm">{w.targetUser.username}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${sev.cls}`}>{sev.label}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{w.issuedBy.username}</td>
                    <td className="px-4 py-3 text-slate-400 text-sm">{w.organization.callsign}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${w.resolved ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                        {w.resolved ? 'Erledigt' : 'Offen'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {format(new Date(w.createdAt), 'dd.MM.yyyy HH:mm')}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <DeleteButton id={w.id} endpoint="/api/org-warnings" />
                      </td>
                    )}
                  </tr>
                );
              })
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
                href={`/dashboard/org-warnings?page=${page - 1}${organizationId ? `&organizationId=${organizationId}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/org-warnings?page=${page + 1}${organizationId ? `&organizationId=${organizationId}` : ''}`}
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
