import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const typeColors: Record<string, string> = {
  POLICE: 'bg-blue-500/20 text-blue-400',
  FIRE: 'bg-orange-500/20 text-orange-400',
  AMBULANCE: 'bg-red-500/20 text-red-400',
  DOJ: 'bg-purple-500/20 text-purple-400',
  CUSTOM: 'bg-slate-500/20 text-slate-400',
};

export default async function OrganizationsPage() {
  await getServerSession(authOptions);

  const organizations = await prisma.organization.findMany({
    include: {
      _count: { select: { units: true, users: true, incidents: true } },
    },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Organisationen</h1>
          <p className="text-slate-400 text-sm mt-1">{organizations.length} Organisationen</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="bg-slate-900 border border-slate-800 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                  style={{ backgroundColor: org.color }}
                >
                  {org.callsign.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-white font-semibold">{org.name}</h3>
                  <p className="text-slate-400 text-xs">{org.callsign}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${typeColors[org.type] ?? 'bg-slate-500/20 text-slate-400'}`}
                >
                  {org.type}
                </span>
                {org.active ? (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Aktiv
                  </span>
                ) : (
                  <span className="text-xs bg-slate-500/20 text-slate-400 px-2 py-1 rounded-full">
                    Inaktiv
                  </span>
                )}
              </div>
            </div>

            {org.description && (
              <p className="text-slate-400 text-sm mb-4">{org.description}</p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-white text-xl font-bold">{org._count.users}</p>
                <p className="text-slate-400 text-xs mt-0.5">Benutzer</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-white text-xl font-bold">{org._count.units}</p>
                <p className="text-slate-400 text-xs mt-0.5">Einheiten</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-white text-xl font-bold">{org._count.incidents}</p>
                <p className="text-slate-400 text-xs mt-0.5">Einsätze</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
