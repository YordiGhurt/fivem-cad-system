'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

const causeLabels: Record<string, string> = {
  NATURAL: 'Natürlich',
  ACCIDENT: 'Unfall',
  HOMICIDE: 'Tötungsdelikt',
  SUICIDE: 'Suizid',
  UNKNOWN: 'Unbekannt',
};

interface DeathCertificateDetailClientProps {
  cert: {
    id: string;
    certificateNumber: string;
    deceasedName: string;
    citizenId: string | null;
    dateOfDeath: Date;
    timeOfDeath: Date | null;
    locationOfDeath: string;
    cause: string;
    causeDescription: string;
    doctor: { id: string; username: string };
    organization: { id: string; name: string; callsign: string };
    additionalNotes: string | null;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  isAdmin?: boolean;
}

export function DeathCertificateDetailClient({ cert, isAdmin }: DeathCertificateDetailClientProps) {
  const [pdfUrl, setPdfUrl] = useState(cert.pdfUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGeneratePDF() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/death-certificates/${cert.id}/pdf`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setPdfUrl(json.data.pdfUrl);
      } else {
        setError(json.error ?? 'PDF-Generierung fehlgeschlagen');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/dashboard/death-certificates" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Zurück zu Totenscheinen
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
              {causeLabels[cert.cause] ?? cert.cause}
            </span>
            <span className="text-xs text-slate-400 font-mono">{cert.certificateNumber}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{cert.deceasedName}</h1>
          {cert.citizenId && <p className="text-slate-400 text-sm mt-1">ID: {cert.citizenId}</p>}
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <DeleteButton
              id={cert.id}
              endpoint="/api/death-certificates"
              redirectTo="/dashboard/death-certificates"
            />
          )}
          {pdfUrl ? (
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              PDF herunterladen
            </a>
          ) : (
            <button onClick={handleGeneratePDF} disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              {generating ? 'Generiere PDF...' : 'PDF generieren'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Beschreibung der Todesursache</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{cert.causeDescription}</p>
          </div>
          {cert.additionalNotes && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Zusätzliche Anmerkungen</h2>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{cert.additionalNotes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Urkundennummer</dt>
                <dd className="text-white text-sm font-mono">{cert.certificateNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Todesdatum</dt>
                <dd className="text-white text-sm">{format(new Date(cert.dateOfDeath), 'dd.MM.yyyy')}</dd>
              </div>
              {cert.timeOfDeath && (
                <div>
                  <dt className="text-slate-500 text-xs">Todeszeit</dt>
                  <dd className="text-white text-sm">{format(new Date(cert.timeOfDeath), 'HH:mm')}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500 text-xs">Todesort</dt>
                <dd className="text-white text-sm">{cert.locationOfDeath}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Ausstellender Arzt</dt>
                <dd className="text-white text-sm">{cert.doctor.username}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Organisation</dt>
                <dd className="text-white text-sm">{cert.organization.callsign} – {cert.organization.name}</dd>
              </div>
            </dl>
          </div>
          {pdfUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">PDF</h3>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-sm break-all">
                PDF herunterladen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
