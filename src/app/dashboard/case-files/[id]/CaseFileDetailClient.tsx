'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  OPEN: 'Offen',
  UNDER_REVIEW: 'In Prüfung',
  CLOSED: 'Geschlossen',
  ARCHIVED: 'Archiviert',
};
const statusColors: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  UNDER_REVIEW: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  ARCHIVED: 'bg-slate-600/20 text-slate-500 border border-slate-600/30',
};

interface CaseFileDetailClientProps {
  caseFile: {
    id: string;
    caseNumber: string;
    title: string;
    description: string;
    status: string;
    citizenName: string | null;
    citizenId: string | null;
    createdBy: { id: string; username: string };
    assignedTo: { id: string; username: string } | null;
    charges: Array<{ id: string; citizenName: string; status: string; issuedBy: { username: string } }>;
    verdicts: Array<{ id: string; caseNumber: string; type: string; judge: { username: string } }>;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function CaseFileDetailClient({ caseFile }: CaseFileDetailClientProps) {
  const [pdfUrl, setPdfUrl] = useState(caseFile.pdfUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGeneratePDF() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/case-files/${caseFile.id}/pdf`, { method: 'POST' });
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
        <Link href="/dashboard/case-files" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Zurück zu Parteiakten
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[caseFile.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {statusLabels[caseFile.status] ?? caseFile.status}
            </span>
            <span className="text-xs text-slate-400 font-mono">{caseFile.caseNumber}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{caseFile.title}</h1>
          {caseFile.citizenName && <p className="text-slate-400 text-sm mt-1">{caseFile.citizenName}{caseFile.citizenId ? ` (${caseFile.citizenId})` : ''}</p>}
        </div>
        <div className="flex gap-3">
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
            <h2 className="text-white font-semibold mb-3">Fallbeschreibung</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: caseFile.description }} />
          </div>
          {caseFile.charges.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Anklagen ({caseFile.charges.length})</h2>
              <div className="space-y-2">
                {caseFile.charges.map((charge) => (
                  <Link key={charge.id} href={`/dashboard/charges/${charge.id}`}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <span className="text-white text-sm">{charge.citizenName}</span>
                    <span className="text-slate-400 text-xs">{charge.status}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          {caseFile.verdicts.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Urteile ({caseFile.verdicts.length})</h2>
              <div className="space-y-2">
                {caseFile.verdicts.map((verdict) => (
                  <Link key={verdict.id} href={`/dashboard/verdicts/${verdict.id}`}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                    <span className="text-white text-sm font-mono">{verdict.caseNumber}</span>
                    <span className="text-slate-400 text-xs">{verdict.type}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Akte-ID</dt>
                <dd className="text-white text-xs font-mono break-all">{caseFile.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Erstellt von</dt>
                <dd className="text-white text-sm">{caseFile.createdBy.username}</dd>
              </div>
              {caseFile.assignedTo && (
                <div>
                  <dt className="text-slate-500 text-xs">Zugewiesen an</dt>
                  <dd className="text-white text-sm">{caseFile.assignedTo.username}</dd>
                </div>
              )}
              <div>
                <dt className="text-slate-500 text-xs">Erstellt am</dt>
                <dd className="text-white text-sm">{format(new Date(caseFile.createdAt), 'dd.MM.yyyy HH:mm')}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Aktualisiert am</dt>
                <dd className="text-white text-sm">{format(new Date(caseFile.updatedAt), 'dd.MM.yyyy HH:mm')}</dd>
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
