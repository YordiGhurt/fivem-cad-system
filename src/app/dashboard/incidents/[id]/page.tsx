import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import IncidentUnitsManager from '@/components/IncidentUnitsManager';

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-red-500/20 text-red-400 border border-red-500/30',
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  CANCELLED: 'bg-slate-600/20 text-slate-500 border border-slate-600/30',
};

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await getServerSession(authOptions);

  const { id } = await params;
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      organization: true,
      units: {
        include: {
          unit: {
            include: { user: true, organization: true },
          },
        },
        orderBy: { assignedAt: 'asc' },
      },
      notes: {
        include: { author: true },
        orderBy: { createdAt: 'asc' },
      },
      reports: {
        include: { author: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!incident) notFound();

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/incidents"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück zu Einsätzen
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-slate-400 font-mono text-sm">{incident.caseNumber}</span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${statusColors[incident.status] ?? 'bg-slate-500/20 text-slate-400'}`}
            >
              {incident.status}
            </span>
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
              Priorität {incident.priority}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{incident.type}</h1>
          <p className="text-slate-400 mt-1">{incident.location}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-sm">
            Erstellt am {format(new Date(incident.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
          </p>
          {incident.closedAt && (
            <p className="text-slate-500 text-xs mt-1">
              Geschlossen: {format(new Date(incident.closedAt), 'dd.MM.yyyy HH:mm', { locale: de })}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-3">Beschreibung</h2>
            <div className="text-slate-300 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: incident.description }} />
          </div>

          {/* Notes */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">
              Notizen ({incident.notes.length})
            </h2>
            {incident.notes.length === 0 ? (
              <p className="text-slate-500 text-sm">Keine Notizen vorhanden</p>
            ) : (
              <div className="space-y-3">
                {incident.notes.map((note) => (
                  <div key={note.id} className="bg-slate-800 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 text-xs font-medium">
                        {note.author.username}
                      </span>
                      <span className="text-slate-500 text-xs">
                        {format(new Date(note.createdAt), 'dd.MM.yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reports */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-white font-semibold mb-4">
              Berichte ({incident.reports.length})
            </h2>
            {incident.reports.length === 0 ? (
              <p className="text-slate-500 text-sm">Keine Berichte vorhanden</p>
            ) : (
              <div className="space-y-2">
                {incident.reports.map((report) => (
                  <Link
                    key={report.id}
                    href={`/dashboard/reports/${report.id}`}
                    className="flex items-center justify-between bg-slate-800 rounded-lg p-3 hover:bg-slate-700 transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{report.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {report.author.username} ·{' '}
                        {format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm')}
                      </p>
                    </div>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
                      {report.type}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Org */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Organisation</h3>
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: incident.organization.color }}
              />
              <div>
                <p className="text-white text-sm font-medium">{incident.organization.name}</p>
                <p className="text-slate-400 text-xs">{incident.organization.callsign}</p>
              </div>
            </div>
          </div>

          {/* Units */}
          <IncidentUnitsManager
            incidentId={incident.id}
            organizationId={incident.organizationId}
            initialUnits={incident.units.map((iu) => ({
              id: iu.id,
              unitId: iu.unit.id,
              assignedAt: iu.assignedAt.toISOString(),
              unit: {
                id: iu.unit.id,
                callsign: iu.unit.callsign,
                status: iu.unit.status,
                user: { username: iu.unit.user.username },
                organization: { callsign: iu.unit.organization.callsign },
              },
            }))}
          />

          {/* Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-slate-500 text-xs">Fallnummer</dt>
                <dd className="text-white text-sm font-mono">{incident.caseNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Typ</dt>
                <dd className="text-white text-sm">{incident.type}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Ort</dt>
                <dd className="text-white text-sm">{incident.location}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Status</dt>
                <dd className="text-white text-sm">{incident.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Priorität</dt>
                <dd className="text-white text-sm">{incident.priority}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
