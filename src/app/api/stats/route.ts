import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = session.user.role;
  if (role !== 'ADMIN' && role !== 'SUPERVISOR') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    incidentTotal,
    incidentsByStatus,
    incidentsByPriority,
    unitActive,
    unitsByStatus,
    citizenTotal,
    reportTotal,
    incidentsLast30Days,
  ] = await Promise.all([
    prisma.incident.count(),
    prisma.incident.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.incident.groupBy({ by: ['priority'], _count: { id: true } }),
    prisma.unit.count({ where: { status: { not: 'OFFDUTY' } } }),
    prisma.unit.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.citizen.count(),
    prisma.report.count(),
    prisma.incident.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  // Group incidents by day for the last 30 days
  const dayMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = 0;
  }
  for (const inc of incidentsLast30Days) {
    const key = inc.createdAt.toISOString().slice(0, 10);
    if (key in dayMap) dayMap[key]++;
  }

  // Last 7 days
  const last7Days = Object.entries(dayMap)
    .filter(([d]) => d >= sevenDaysAgo.toISOString().slice(0, 10))
    .sort(([a], [b]) => a.localeCompare(b));

  return NextResponse.json({
    data: {
      incidents: {
        total: incidentTotal,
        byStatus: incidentsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
        byPriority: incidentsByPriority.map((p) => ({ priority: p.priority, count: p._count.id })),
        perDay: last7Days.map(([date, count]) => ({ date, count })),
        perDayFull: Object.entries(dayMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
      },
      units: {
        active: unitActive,
        byStatus: unitsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
      },
      citizens: { total: citizenTotal },
      reports: { total: reportTotal },
    },
  });
}
