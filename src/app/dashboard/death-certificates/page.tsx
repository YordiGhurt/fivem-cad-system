import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { format } from 'date-fns';

const causeLabels: Record<string, string> = {
  NATURAL: 'Natürlich',
  ACCIDENT: 'Unfall',
  HOMICIDE: 'Tötungsdelikt',
  SUICIDE: 'Suizid',
  UNKNOWN: 'Unbekannt',
};

const causeColors: Record<string, string> = {
  NATURAL: 'bg-green-500/20 text-green-400 border border-green-500/30',
  ACCIDENT: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  HOMICIDE: 'bg-red-500/20 text-red-400 border border-red-500/30',
  SUICIDE: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  UNKNOWN: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

interface SearchParams {
  search?: string;
  page?: string;
}

export default async function DeathCertificatesPage({
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
      { deceasedName: { contains: search, mode: 'insensitive' } },
      { certificateNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [certs, total] = await Promise.all([
    prisma.deathCertificate.findMany({
      where,
      include: {
        doctor: { select: { id: true, username: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.deathCertificate.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Totenscheine</h1>
          <p className="text-slate-400 text-sm mt-1">{total} Totenscheine gesamt</p>
        </div>
        <Link
          href="/dashboard/death-certificates/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + Neuer Totenschein
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <form className="flex gap-3 flex-wrap">
          <input
            name="search"
            defaultValue={search}
            placeholder="Name, Zertifikatnummer..."
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
              href="/dashboard/death-certificates"
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
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Zertifikat-Nr.</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Verstorbener</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Todesdatum</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Todesursache</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Todesort</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Arzt</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Organisation</th>
            </tr>
          </thead>
          <tbody>
            {certs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  Keine Totenscheine gefunden
                </td>
              </tr>
            ) : (
              certs.map((cert) => (
                <tr key={cert.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-sm">{cert.certificateNumber}</td>
                  <td className="px-4 py-3 text-white font-medium">{cert.deceasedName}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {format(new Date(cert.dateOfDeath), 'dd.MM.yyyy')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${causeColors[cert.cause] ?? 'bg-slate-500/20 text-slate-400'}`}>
                      {causeLabels[cert.cause] ?? cert.cause}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm max-w-40 truncate">{cert.locationOfDeath}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{cert.doctor.username}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{cert.organization.name}</td>
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
                href={`/dashboard/death-certificates?page=${page - 1}${search ? `&search=${search}` : ''}`}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Zurück
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/dashboard/death-certificates?page=${page + 1}${search ? `&search=${search}` : ''}`}
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
