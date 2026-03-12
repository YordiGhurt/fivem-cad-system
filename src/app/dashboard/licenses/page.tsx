import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';

interface SearchParams {
  search?: string;
  page?: string;
  tab?: string;
}

type LicencesJson = { driver?: boolean; fly?: boolean; gun?: boolean } | null;

export default async function LicensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  const sp = await searchParams;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const tab = sp.tab ?? 'weapons';
  const pageSize = 20;

  // --- Weapons (Waffenlizenzen) ---
  const weaponWhere: Record<string, unknown> = { licensed: true };
  if (search && tab === 'weapons') {
    weaponWhere.OR = [
      { serialNumber: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { owner: { citizenId: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // --- Driver / Fly licences (from Citizen.licences JSON) ---
  const citizenWhere: Record<string, unknown> = {};
  if (search && (tab === 'driver' || tab === 'fly')) {
    citizenWhere.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { citizenId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [weapons, weaponTotal, allCitizens, citizenTotal] = await Promise.all([
    tab === 'weapons'
      ? prisma.weapon.findMany({
          where: weaponWhere,
          include: {
            owner: { select: { id: true, citizenId: true, firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
      : Promise.resolve([]),
    tab === 'weapons'
      ? prisma.weapon.count({ where: weaponWhere })
      : Promise.resolve(0),
    tab !== 'weapons'
      ? prisma.citizen.findMany({
          where: citizenWhere,
          orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        })
      : Promise.resolve([]),
    tab !== 'weapons'
      ? prisma.citizen.count({ where: citizenWhere })
      : Promise.resolve(0),
  ]);

  // Filter client-side for driver / fly (JSON field filtering in Prisma is DB-dependent)
  const filteredCitizens = allCitizens.filter((c) => {
    const lic = c.licences as LicencesJson;
    if (tab === 'driver') return lic?.driver === true;
    if (tab === 'fly') return lic?.fly === true;
    return false;
  });

  const total = tab === 'weapons' ? weaponTotal : citizenTotal;
  const totalPages = Math.ceil(total / pageSize);

  const tabs = [
    { key: 'weapons', label: 'Waffenlizenzen' },
    { key: 'driver', label: 'Fahrerlaubnisse' },
    { key: 'fly', label: 'Pilotenlizenzen' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Lizenzen</h1>
          <p className="text-slate-400 text-sm mt-1">Lizenz-Verwaltung</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/licenses?tab=${t.key}${search ? `&search=${encodeURIComponent(search)}` : ''}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input type="hidden" name="tab" value={tab} />
          <input
            name="search"
            defaultValue={search}
            placeholder={tab === 'weapons' ? 'Seriennummer, Modell, Bürger-ID...' : 'Name, Bürger-ID...'}
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
              href={`/dashboard/licenses?tab=${tab}`}
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Zurücksetzen
            </Link>
          )}
        </form>
      </div>

      {/* Weapons Tab */}
      {tab === 'weapons' && (
        <>
          <p className="text-slate-500 text-xs mb-3">{weaponTotal} lizenzierte Waffe{weaponTotal !== 1 ? 'n' : ''} gesamt</p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Seriennummer</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Modell</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Eigentümer</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Hinzugefügt</th>
                </tr>
              </thead>
              <tbody>
                {weapons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      Keine lizenzierten Waffen gefunden
                    </td>
                  </tr>
                ) : (
                  weapons.map((weapon) => (
                    <tr key={weapon.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono text-sm">{weapon.serialNumber}</td>
                      <td className="px-4 py-3 text-slate-300 text-sm">{weapon.model}</td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/citizens/${weapon.owner.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                          {weapon.owner.firstName} {weapon.owner.lastName}
                        </Link>
                        <p className="text-slate-500 text-xs font-mono">{weapon.owner.citizenId}</p>
                      </td>
                      <td className="px-4 py-3">
                        {weapon.flagged ? (
                          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">Markiert</span>
                        ) : (
                          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">Gültig</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {format(new Date(weapon.createdAt), 'dd.MM.yyyy')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Driver / Fly Tab */}
      {(tab === 'driver' || tab === 'fly') && (
        <>
          <p className="text-slate-500 text-xs mb-3">
            {filteredCitizens.length} {tab === 'driver' ? 'Fahrerlaubnisse' : 'Pilotenlizenzen'} gefunden
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Bürger-ID</th>
                  <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCitizens.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-slate-500">
                      Keine {tab === 'driver' ? 'Fahrerlaubnisse' : 'Pilotenlizenzen'} gefunden
                    </td>
                  </tr>
                ) : (
                  filteredCitizens.map((c) => (
                    <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/citizens/${c.id}`} className="text-blue-400 hover:text-blue-300 text-sm">
                          {c.firstName} {c.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs font-mono">{c.citizenId}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">Gültig</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination (weapons only) */}
      {tab === 'weapons' && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-slate-400 text-sm">
            Seite {page} von {totalPages} · {total} Einträge
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/dashboard/licenses?tab=${tab}&page=${page - 1}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/licenses?tab=${tab}&page=${page + 1}${search ? `&search=${search}` : ''}`}
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
