import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function CitizenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  const canViewMedical = (session?.user as { orgPermissions?: { canViewMedicalRecords?: boolean } } | undefined)?.orgPermissions?.canViewMedicalRecords ?? false;

  const citizen = await prisma.citizen.findUnique({
    where: { id },
    include: {
      vehicles: { orderBy: { createdAt: 'desc' } },
      weapons: { orderBy: { createdAt: 'desc' } },
      charges: { where: { status: { in: ['PENDING', 'ACTIVE'] } }, orderBy: { createdAt: 'desc' }, take: 5 },
      verdicts: { orderBy: { issuedAt: 'desc' }, take: 5 },
      caseFiles: { orderBy: { createdAt: 'desc' }, take: 5 },
      medicalRecords: canViewMedical ? { orderBy: { createdAt: 'desc' }, take: 5 } : undefined,
    },
  });

  if (!citizen) notFound();

  // Load warrants separately (no direct relation)
  const warrants = await prisma.warrant.findMany({
    where: { citizenId: citizen.citizenId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/citizens"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück zu Bürgern
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {citizen.firstName} {citizen.lastName}
          </h1>
          <p className="text-slate-400 font-mono text-sm mt-1">{citizen.citizenId}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Personal info */}
        <div className="col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">Persönliche Daten</h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Bürger-ID</dt>
                <dd className="text-white text-sm font-mono">{citizen.citizenId}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Vorname</dt>
                <dd className="text-white text-sm">{citizen.firstName}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Nachname</dt>
                <dd className="text-white text-sm">{citizen.lastName}</dd>
              </div>
              {citizen.dateOfBirth && (
                <div>
                  <dt className="text-slate-500 text-xs">Geburtsdatum</dt>
                  <dd className="text-white text-sm">
                    {format(new Date(citizen.dateOfBirth), 'dd.MM.yyyy')}
                  </dd>
                </div>
              )}
              {citizen.gender && (
                <div>
                  <dt className="text-slate-500 text-xs">Geschlecht</dt>
                  <dd className="text-white text-sm">{citizen.gender}</dd>
                </div>
              )}
              {citizen.phone && (
                <div>
                  <dt className="text-slate-500 text-xs">Telefon</dt>
                  <dd className="text-white text-sm">{citizen.phone}</dd>
                </div>
              )}
              {citizen.address && (
                <div>
                  <dt className="text-slate-500 text-xs">Adresse</dt>
                  <dd className="text-white text-sm">{citizen.address}</dd>
                </div>
              )}
              {citizen.nationality && (
                <div>
                  <dt className="text-slate-500 text-xs">Nationalität</dt>
                  <dd className="text-white text-sm">{citizen.nationality}</dd>
                </div>
              )}
            </dl>
          </div>

          {citizen.notes && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-white font-semibold mb-3">Notizen</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {citizen.notes}
              </p>
            </div>
          )}
        </div>

        {/* Vehicles & Weapons */}
        <div className="col-span-2 space-y-6">
          {/* Vehicles */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">
              Fahrzeuge ({citizen.vehicles.length})
            </h2>
            {citizen.vehicles.length === 0 ? (
              <p className="text-slate-500 text-sm">Keine Fahrzeuge registriert</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Kennzeichen</th>
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Modell</th>
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Farbe</th>
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {citizen.vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-slate-800/50">
                      <td className="py-2 pr-4">
                        <Link
                          href={`/dashboard/vehicles`}
                          className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                        >
                          {vehicle.plate}
                        </Link>
                      </td>
                      <td className="py-2 pr-4 text-white text-sm">{vehicle.model}</td>
                      <td className="py-2 pr-4 text-slate-400 text-sm">{vehicle.color}</td>
                      <td className="py-2">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Weapons */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">
              Waffen ({citizen.weapons.length})
            </h2>
            {citizen.weapons.length === 0 ? (
              <p className="text-slate-500 text-sm">Keine Waffen registriert</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Seriennummer</th>
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Modell</th>
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Lizenziert</th>
                    <th className="text-left pb-2 text-slate-400 text-xs font-medium uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {citizen.weapons.map((weapon) => (
                    <tr key={weapon.id} className="border-b border-slate-800/50">
                      <td className="py-2 pr-4 text-slate-300 font-mono text-sm">
                        {weapon.serialNumber}
                      </td>
                      <td className="py-2 pr-4 text-white text-sm">{weapon.model}</td>
                      <td className="py-2 pr-4">
                        {weapon.licensed ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Ja</span>
                        ) : (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Nein</span>
                        )}
                      </td>
                      <td className="py-2">
                        {weapon.flagged ? (
                          <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                            Markiert
                          </span>
                        ) : (
                          <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Warrants */}
        {warrants.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Offene Haftbefehle ({warrants.length})</h2>
            <div className="space-y-2">
              {warrants.map((w) => (
                <Link key={w.id} href={`/dashboard/warrants/${w.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white text-sm">{w.reason.slice(0, 60)}…</span>
                  <span className="text-xs text-slate-400">{format(new Date(w.createdAt), 'dd.MM.yyyy')}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Charges */}
        {citizen.charges && citizen.charges.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Aktive Anklagen ({citizen.charges.length})</h2>
            <div className="space-y-2">
              {citizen.charges.map((c) => (
                <Link key={c.id} href={`/dashboard/charges/${c.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white text-sm">{c.description.replace(/<[^>]+>/g, '').slice(0, 60)}</span>
                  <span className="text-xs text-slate-400">{c.status}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Verdicts */}
        {citizen.verdicts && citizen.verdicts.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Urteile ({citizen.verdicts.length})</h2>
            <div className="space-y-2">
              {citizen.verdicts.map((v) => (
                <Link key={v.id} href={`/dashboard/verdicts/${v.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white text-sm font-mono">{v.caseNumber}</span>
                  <span className="text-xs text-slate-400">{v.type}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Case Files */}
        {citizen.caseFiles && citizen.caseFiles.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Parteiakten ({citizen.caseFiles.length})</h2>
            <div className="space-y-2">
              {citizen.caseFiles.map((cf) => (
                <Link key={cf.id} href={`/dashboard/case-files/${cf.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white text-sm">{cf.title}</span>
                  <span className="text-xs text-slate-400 font-mono">{cf.caseNumber}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Medical Records */}
        {canViewMedical && citizen.medicalRecords && citizen.medicalRecords.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Medizinische Akten ({citizen.medicalRecords.length})</h2>
            <div className="space-y-2">
              {citizen.medicalRecords.map((mr) => (
                <Link key={mr.id} href={`/dashboard/medical-records/${mr.id}`}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  <span className="text-white text-sm font-mono">{mr.recordNumber}</span>
                  {mr.confidential && <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">VERTRAULICH</span>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
