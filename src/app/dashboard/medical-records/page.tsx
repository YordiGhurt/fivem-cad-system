import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';

interface SearchParams {
  search?: string;
  page?: string;
}

export default async function MedicalRecordsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  const sp = await searchParams;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { citizenName: { contains: search, mode: 'insensitive' } },
      { recordNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [records, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      include: {
        author: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Medizinische Akten</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Akten gesamt</p>
        </div>
        <Link
          href="/dashboard/medical-records/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neue Akte
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Bürger, Aktennummer..."
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
              href="/dashboard/medical-records"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktennummer</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Bürger</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Diagnose</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Blutgruppe</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Vertraulich</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Autor</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Organisation</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Datum</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Keine medizinischen Akten gefunden
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-sm">{record.recordNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{record.citizenName}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm max-w-40 truncate">{record.diagnosis}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{record.bloodType ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${record.confidential ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                      {record.confidential ? 'Ja' : 'Nein'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{record.author.username}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{record.organization.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(record.createdAt), 'dd.MM.yyyy HH:mm')}
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
                href={`/dashboard/medical-records?page=${page - 1}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/medical-records?page=${page + 1}${search ? `&search=${search}` : ''}`}
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
