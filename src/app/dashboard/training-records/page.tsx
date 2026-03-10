import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

interface SearchParams {
  organizationId?: string;
  search?: string;
  page?: string;
}

const typeLabels: Record<string, string> = {
  BASIC: 'Grundausbildung',
  ADVANCED: 'Fortgeschritten',
  SPECIALIST: 'Spezialausbildung',
  REFRESHER: 'Auffrischung',
  SUPERVISOR: 'Leitungsausbildung',
  CUSTOM: 'Sonstige',
};

export default async function TrainingRecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);

  const sp = await searchParams;
  const organizationId = sp.organizationId ?? (session?.user?.organizationId ?? undefined);
  const search = sp.search ?? '';
  const isAdmin = session?.user?.role === 'ADMIN';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (organizationId) where.organizationId = organizationId;
  if (search) {
    where.OR = [
      { traineeName: { contains: search, mode: 'insensitive' } },
      { trainerName: { contains: search, mode: 'insensitive' } },
      { recordNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.trainingRecord.findMany({
      where,
      include: {
        trainee: { select: { id: true, username: true } },
        trainer: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true, callsign: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.trainingRecord.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Ausbildung</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Ausbildungsakten gesamt</p>
        </div>
        <Link
          href="/dashboard/training-records/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neue Ausbildungsakte
        </Link>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Auszubildender, Ausbilder, Aktennummer..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Suchen
          </button>
          {search && (
            <Link
              href="/dashboard/training-records"
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Zurücksetzen
            </Link>
          )}
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktennummer</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Auszubildender</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Ausbilder</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Typ</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Organisation</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Ergebnis</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Datum</th>
              {isAdmin && <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktionen</th>}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-4 py-12 text-center text-slate-500">
                  Keine Ausbildungsakten gefunden
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-sm">{r.recordNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{r.traineeName}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{r.trainerName}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{typeLabels[r.type] ?? r.type}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{r.organization.callsign}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${r.passed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {r.passed ? 'Bestanden' : 'Nicht bestanden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(r.date), 'dd.MM.yyyy')}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <DeleteButton id={r.id} endpoint="/api/training-records" />
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
                href={`/dashboard/training-records?page=${page - 1}${search ? `&search=${search}` : ''}${organizationId ? `&organizationId=${organizationId}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/training-records?page=${page + 1}${search ? `&search=${search}` : ''}${organizationId ? `&organizationId=${organizationId}` : ''}`}
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
