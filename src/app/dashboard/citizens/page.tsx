import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';

interface SearchParams {
  search?: string;
  page?: string;
}

export default async function CitizensPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  const sp = await searchParams;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { citizenId: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [citizens, total] = await Promise.all([
    prisma.citizen.findMany({
      where,
      include: { _count: { select: { vehicles: true, weapons: true } } },
      orderBy: { lastName: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.citizen.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bürger</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Bürger gesamt</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3">
          <input
            name="search"
            defaultValue={search}
            placeholder="Suche nach Name, Bürger-ID, Telefon..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Suchen
          </button>
          {search && (
            <Link
              href="/dashboard/citizens"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Name</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Bürger-ID</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Geburtsdatum</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Telefon</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Adresse</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Fahrzeuge</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Waffen</th>
            </tr>
          </thead>
          <tbody>
            {citizens.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  Keine Bürger gefunden
                </td>
              </tr>
            ) : (
              citizens.map((citizen) => (
                <tr
                  key={citizen.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/citizens/${citizen.id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium"
                    >
                      {citizen.firstName} {citizen.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm font-mono">{citizen.citizenId}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {citizen.dateOfBirth
                      ? format(new Date(citizen.dateOfBirth), 'dd.MM.yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{citizen.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm truncate max-w-48">
                    {citizen.address ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm text-center">
                    {citizen._count.vehicles}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm text-center">
                    {citizen._count.weapons}
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
                href={`/dashboard/citizens?page=${page - 1}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/citizens?page=${page + 1}${search ? `&search=${search}` : ''}`}
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
