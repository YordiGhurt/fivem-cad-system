import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminPanel from './AdminPanel';

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
    prisma.organization.findMany({
      include: { permissions: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.active).length,
    adminCount: users.filter((u) => u.role === 'ADMIN').length,
    orgCount: organizations.length,
  };

  // Serialize dates to strings for client component
  const serializedUsers = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    password: '',
  }));

  const serializedOrgs = organizations.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    permissions: o.permissions
      ? {
          ...o.permissions,
          createdAt: o.permissions.createdAt.toISOString(),
          updatedAt: o.permissions.updatedAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <p className="text-slate-400 text-sm mt-1">Benutzerverwaltung und Systemübersicht</p>
      </div>
      <AdminPanel
        initialUsers={serializedUsers}
        initialOrgs={serializedOrgs}
        stats={stats}
      />
    </div>
  );
}
