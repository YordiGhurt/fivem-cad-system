import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Users, Radio, AlertTriangle, Shield, Layers } from 'lucide-react';

const typeColors: Record<string, string> = {
  POLICE: 'bg-blue-500/20 text-blue-400',
  FIRE: 'bg-orange-500/20 text-orange-400',
  AMBULANCE: 'bg-red-500/20 text-red-400',
  DOJ: 'bg-purple-500/20 text-purple-400',
  CUSTOM: 'bg-slate-500/20 text-slate-400',
};

const unitStatusColors: Record<string, string> = {
  AVAILABLE: 'bg-green-500/20 text-green-400',
  BUSY: 'bg-yellow-500/20 text-yellow-400',
  OFFDUTY: 'bg-slate-500/20 text-slate-400',
  ONSCENE: 'bg-blue-500/20 text-blue-400',
  ENROUTE: 'bg-orange-500/20 text-orange-400',
  BREAK: 'bg-purple-500/20 text-purple-400',
};

const incidentStatusColors: Record<string, string> = {
  ACTIVE: 'bg-red-500/20 text-red-400',
  PENDING: 'bg-yellow-500/20 text-yellow-400',
  CLOSED: 'bg-slate-500/20 text-slate-400',
  CANCELLED: 'bg-slate-600/20 text-slate-500',
};

const permissionLabels: { key: string; label: string }[] = [
  { key: 'canViewIncidents', label: 'Einsätze ansehen' },
  { key: 'canCreateIncidents', label: 'Einsätze erstellen' },
  { key: 'canViewWarrants', label: 'Haftbefehle ansehen' },
  { key: 'canCreateWarrants', label: 'Haftbefehle erstellen' },
  { key: 'canViewReports', label: 'Berichte ansehen' },
  { key: 'canCreateReports', label: 'Berichte erstellen' },
  { key: 'canViewCitizens', label: 'Bürger ansehen' },
  { key: 'canViewVehicles', label: 'Fahrzeuge ansehen' },
  { key: 'canManageUnits', label: 'Einheiten verwalten' },
];

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getServerSession(authOptions);

  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        include: { rank: true },
        orderBy: { username: 'asc' },
      },
      units: {
        include: { user: true },
        orderBy: { callsign: 'asc' },
      },
      incidents: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      news: {
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
        take: 3,
        include: { author: { select: { id: true, username: true } } },
      },
      permissions: true,
      ranks: {
        orderBy: { level: 'asc' },
      },
      _count: { select: { users: true, units: true, incidents: true } },
    },
  });

  if (!org) notFound();

  const activeUnits = org.units.filter((u) => u.status !== 'OFFDUTY');

  return (
    <div className="p-6">
      {/* Back link */}
      <Link
        href="/dashboard/organizations"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Zurück zu Organisationen
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
          style={{ backgroundColor: org.color }}
        >
          {org.callsign.slice(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white">{org.name}</h1>
            <span
              className={`text-xs px-2 py-1 rounded-full ${typeColors[org.type] ?? 'bg-slate-500/20 text-slate-400'}`}
            >
              {org.type}
            </span>
            {org.active ? (
              <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">
                Aktiv
              </span>
            ) : (
              <span className="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-1 rounded-full">
                Inaktiv
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm font-mono">{org.callsign}</p>
          {org.description && <p className="text-slate-400 text-sm mt-1">{org.description}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{org._count.users}</p>
            <p className="text-slate-400 text-xs">Mitglieder</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-600/20 rounded-xl flex items-center justify-center">
            <Radio className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{activeUnits.length}</p>
            <p className="text-slate-400 text-xs">Aktive Einheiten</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{org._count.incidents}</p>
            <p className="text-slate-400 text-xs">Einsätze gesamt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Members */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Mitglieder</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {org.users.length === 0 && (
              <p className="text-slate-400 text-sm px-5 py-4">Keine Mitglieder</p>
            )}
            {org.users.map((user) => (
              <div key={user.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{user.username}</p>
                  <p className="text-slate-500 text-xs">{user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {user.rank && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: user.rank.color + '33',
                        color: user.rank.color,
                      }}
                    >
                      {user.rank.name}
                    </span>
                  )}
                  <span className="text-xs text-slate-500">{user.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Units */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Radio className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Aktive Einheiten</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {activeUnits.length === 0 && (
              <p className="text-slate-400 text-sm px-5 py-4">Keine aktiven Einheiten</p>
            )}
            {activeUnits.map((unit) => (
              <div key={unit.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium font-mono">{unit.callsign}</p>
                  <p className="text-slate-500 text-xs">{unit.user.username}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${unitStatusColors[unit.status] ?? 'bg-slate-500/20 text-slate-400'}`}
                >
                  {unit.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Ranks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Ränge</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {org.ranks.length === 0 && (
              <p className="text-slate-400 text-sm px-5 py-4">Keine Ränge definiert</p>
            )}
            {org.ranks.map((rank) => (
              <div key={rank.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: rank.color }}
                  />
                  <span className="text-white text-sm">{rank.name}</span>
                </div>
                <span className="text-slate-500 text-xs">Level {rank.level}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <h2 className="text-white font-semibold">Berechtigungen</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {!org.permissions ? (
              <p className="text-slate-400 text-sm px-5 py-4">Keine Berechtigungen konfiguriert (Standardwerte aktiv)</p>
            ) : (
              permissionLabels.map(({ key, label }) => {
                const value = (org.permissions as Record<string, unknown>)?.[key] as boolean | undefined;
                return (
                  <div key={key} className="px-5 py-3 flex items-center justify-between">
                    <span className="text-slate-300 text-sm">{label}</span>
                    {value ? (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                        Ja
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-500/20 text-slate-500 px-2 py-0.5 rounded-full">
                        Nein
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent OrgNews */}
      {org.news.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Aktuelle News</h2>
            <Link
              href={`/dashboard/org-news?organizationId=${org.id}`}
              className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
            >
              Alle ansehen →
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {org.news.map((item) => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-1">
                  {item.pinned && (
                    <span className="text-xs text-yellow-400">📌</span>
                  )}
                  <span className="text-white text-sm font-medium">{item.title}</span>
                  <span className="text-slate-500 text-xs ml-auto">
                    {format(new Date(item.createdAt), 'dd.MM.yyyy')}
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{item.author.username}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <h2 className="text-white font-semibold">Letzte Einsätze</h2>
        </div>
        {org.incidents.length === 0 ? (
          <p className="text-slate-400 text-sm px-5 py-4">Keine Einsätze vorhanden</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                  Fallnummer
                </th>
                <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                  Typ
                </th>
                <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                  Ort
                </th>
                <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">
                  Erstellt
                </th>
              </tr>
            </thead>
            <tbody>
              {org.incidents.map((incident) => (
                <tr
                  key={incident.id}
                  className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-white font-mono text-sm">{incident.caseNumber}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{incident.type}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{incident.location}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${incidentStatusColors[incident.status] ?? 'bg-slate-500/20 text-slate-400'}`}
                    >
                      {incident.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {format(new Date(incident.createdAt), 'dd.MM.yyyy HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
