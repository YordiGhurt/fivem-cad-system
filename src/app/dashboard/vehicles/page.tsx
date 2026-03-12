import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlateCheckButton } from './PlateCheckButton';
import { FlagVehicleButton } from '@/components/FlagVehicleButton';

interface SearchParams {
  search?: string;
  page?: string;
  stolen?: string;
  flagged?: string;
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await getServerSession(authOptions);

  const sp = await searchParams;
  const search = sp.search ?? '';
  const page = parseInt(sp.page ?? '1');
  const pageSize = 20;
  const stolenOnly = sp.stolen === 'true';
  const flaggedOnly = sp.flagged === 'true';

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { plate: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } },
      { color: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (stolenOnly) where.stolen = true;
  if (flaggedOnly) where.flagged = true;

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: { owner: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.vehicle.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fahrzeuge</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Fahrzeuge gesamt</p>
        </div>
        <PlateCheckButton />
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Kennzeichen, Modell, Farbe..."
            className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="stolen"
              value="true"
              defaultChecked={stolenOnly}
              className="rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500"
            />
            Nur gestohlene
          </label>
          <label className="flex items-center gap-2 text-slate-300 text-sm cursor-pointer">
            <input
              type="checkbox"
              name="flagged"
              value="true"
              defaultChecked={flaggedOnly}
              className="rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500"
            />
            Nur markierte
          </label>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Filtern
          </button>
          {(search || stolenOnly || flaggedOnly) && (
            <Link
              href="/dashboard/vehicles"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Kennzeichen</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Modell</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Farbe</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Eigentümer</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Zulassung bis</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Hinzugefügt</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                  Keine Fahrzeuge gefunden
                </td>
              </tr>
            ) : (
              vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono font-medium">{vehicle.plate}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{vehicle.model}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{vehicle.color}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/citizens/${vehicle.owner.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {vehicle.owner.firstName} {vehicle.owner.lastName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {vehicle.stolen && (
                        <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">
                          Gestohlen
                        </span>
                      )}
                      {vehicle.flagged && (
                        <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                          Markiert
                        </span>
                      )}
                      {!vehicle.stolen && !vehicle.flagged && (
                        <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                          OK
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {vehicle.registrationExpiry
                      ? format(new Date(vehicle.registrationExpiry), 'dd.MM.yyyy')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(vehicle.createdAt), 'dd.MM.yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <FlagVehicleButton plate={vehicle.plate} currentlyFlagged={vehicle.flagged ?? false} />
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
                href={`/dashboard/vehicles?page=${page - 1}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/vehicles?page=${page + 1}${search ? `&search=${search}` : ''}`}
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
