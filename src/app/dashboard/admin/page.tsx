import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-400 border border-red-500/30',
  SUPERVISOR: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  OFFICER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  DISPATCHER: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  USER: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [users, organizations] = await Promise.all([
    prisma.user.findMany({
      include: { organization: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.organization.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.active).length,
    adminCount: users.filter((u) => u.role === 'ADMIN').length,
    orgCount: organizations.length,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-slate-400 text-sm mt-1">Benutzerverwaltung und Systemübersicht</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Benutzer gesamt</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Aktive Benutzer</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{stats.activeUsers}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Administratoren</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{stats.adminCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-sm">Organisationen</p>
          <p className="text-3xl font-bold text-blue-400 mt-1">{stats.orgCount}</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold">Benutzerverwaltung</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Benutzername</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">E-Mail</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Rolle</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Organisation</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Erstellt</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{user.username}</td>
                <td className="px-4 py-3 text-slate-300 text-sm">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${roleColors[user.role] ?? 'bg-slate-500/20 text-slate-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">
                  {user.organization ? (
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: user.organization.color + '22',
                        color: user.organization.color,
                      }}
                    >
                      {user.organization.callsign}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.active ? (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">
                      Aktiv
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-1 rounded-full">
                      Inaktiv
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">
                  {format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Organizations Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold">Organisationen</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Name</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Rufzeichen</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Typ</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Farbe</th>
              <th className="text-left px-4 py-3 text-slate-400 text-xs font-medium uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {organizations.map((org) => (
              <tr key={org.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 text-white font-medium">{org.name}</td>
                <td className="px-4 py-3 text-slate-300 text-sm font-mono">{org.callsign}</td>
                <td className="px-4 py-3 text-slate-400 text-sm">{org.type}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: org.color }}
                    />
                    <span className="text-slate-400 text-xs font-mono">{org.color}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {org.active ? (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">
                      Aktiv
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-500/20 text-slate-400 border border-slate-500/30 px-2 py-1 rounded-full">
                      Inaktiv
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
