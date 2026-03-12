import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Search, Users, Car, AlertTriangle, FileWarning } from 'lucide-react';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await getServerSession(authOptions);

  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  let citizens: Array<{ id: string; firstName: string; lastName: string; citizenId: string }> = [];
  let vehicles: Array<{ id: string; plate: string; model: string; color: string }> = [];
  let incidents: Array<{ id: string; caseNumber: string; type: string; location: string; status: string }> = [];
  let warrants: Array<{ id: string; reason: string; citizenName: string; status: string }> = [];

  if (query) {
    [citizens, vehicles, incidents, warrants] = await Promise.all([
      prisma.citizen.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { citizenId: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.vehicle.findMany({
        where: {
          OR: [
            { plate: { contains: query, mode: 'insensitive' } },
            { model: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.incident.findMany({
        where: {
          OR: [
            { caseNumber: { contains: query, mode: 'insensitive' } },
            { type: { contains: query, mode: 'insensitive' } },
            { location: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      prisma.warrant.findMany({
        where: {
          OR: [
            { reason: { contains: query, mode: 'insensitive' } },
            { citizenName: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
    ]);
  }

  const totalResults = citizens.length + vehicles.length + incidents.length + warrants.length;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Globale Suche</h1>
      </div>

      <form method="GET" className="mb-8">
        <div className="flex gap-3">
          <input
            name="q"
            defaultValue={query}
            placeholder="Bürger, Kennzeichen, Einsatz, Haftbefehl..."
            autoFocus
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Suchen
          </button>
        </div>
      </form>

      {query && (
        <p className="text-slate-400 text-sm mb-6">
          {totalResults} Ergebnis{totalResults !== 1 ? 'se' : ''} für &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Citizens */}
      {citizens.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-400" />
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Bürger</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {citizens.map((c, i) => (
              <Link
                key={c.id}
                href={`/dashboard/citizens/${c.id}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors ${i < citizens.length - 1 ? 'border-b border-slate-800' : ''}`}
              >
                <span className="text-white text-sm font-medium">{c.firstName} {c.lastName}</span>
                <span className="text-slate-500 text-xs font-mono">{c.citizenId}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Vehicles */}
      {vehicles.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Car className="w-4 h-4 text-green-400" />
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Fahrzeuge</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {vehicles.map((v, i) => (
              <Link
                key={v.id}
                href={`/dashboard/vehicles?search=${encodeURIComponent(v.plate)}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors ${i < vehicles.length - 1 ? 'border-b border-slate-800' : ''}`}
              >
                <span className="text-white text-sm font-mono font-medium">{v.plate}</span>
                <span className="text-slate-400 text-xs">{v.model} · {v.color}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Incidents */}
      {incidents.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Einsätze</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {incidents.map((inc, i) => (
              <Link
                key={inc.id}
                href={`/dashboard/incidents/${inc.id}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors ${i < incidents.length - 1 ? 'border-b border-slate-800' : ''}`}
              >
                <div>
                  <span className="text-white text-sm font-medium">{inc.type}</span>
                  <span className="text-slate-500 text-xs ml-3">{inc.location}</span>
                </div>
                <span className="text-slate-400 text-xs font-mono">{inc.caseNumber}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Warrants */}
      {warrants.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileWarning className="w-4 h-4 text-red-400" />
            <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Haftbefehle</h2>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {warrants.map((w, i) => (
              <Link
                key={w.id}
                href={`/dashboard/warrants/${w.id}`}
                className={`flex items-center justify-between px-4 py-3 hover:bg-slate-800 transition-colors ${i < warrants.length - 1 ? 'border-b border-slate-800' : ''}`}
              >
                <span className="text-white text-sm font-medium">{w.citizenName}</span>
                <span className="text-slate-400 text-xs truncate max-w-48">{w.reason}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {query && totalResults === 0 && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <Search className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Suchbegriff eingeben um zu suchen</p>
        </div>
      )}
    </div>
  );
}
