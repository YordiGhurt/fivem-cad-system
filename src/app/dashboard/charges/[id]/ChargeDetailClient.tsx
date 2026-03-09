'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';

const statusLabels: Record<string, string> = {
  PENDING: 'Ausstehend',
  ACTIVE: 'Aktiv',
  DISMISSED: 'Eingestellt',
  SERVED: 'Vollstreckt',
};
const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  ACTIVE: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  DISMISSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  SERVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

interface ChargeDetailClientProps {
  charge: {
    id: string;
    citizenName: string;
    citizenId: string | null;
    description: string;
    status: string;
    issuedBy: { id: string; username: string };
    law: { id: string; code: string; title: string } | null;
    caseFile: { id: string; caseNumber: string; title: string } | null;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function ChargeDetailClient({ charge }: ChargeDetailClientProps) {
  const [pdfUrl, setPdfUrl] = useState(charge.pdfUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGeneratePDF() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/charges/${charge.id}/pdf`, { method: 'POST' });
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
        <Link href="/dashboard/charges" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Zurück zu Anklagen
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[charge.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {statusLabels[charge.status] ?? charge.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{charge.citizenName}</h1>
          {charge.citizenId && <p className="text-slate-400 text-sm mt-1">ID: {charge.citizenId}</p>}
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
        <div className="col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Anklagebeschreibung</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: charge.description }} />
          </div>
          {charge.law && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-4">
              <h2 className="text-white font-semibold mb-3">Gesetzliche Grundlage</h2>
              <Link href={`/dashboard/laws`} className="text-blue-400 hover:text-blue-300 font-mono text-sm">
                {charge.law.code}
              </Link>
              <p className="text-slate-300 text-sm mt-1">{charge.law.title}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Anklage-ID</dt>
                <dd className="text-white text-xs font-mono break-all">{charge.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Ankläger</dt>
                <dd className="text-white text-sm">{charge.issuedBy.username}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Erstellt am</dt>
                <dd className="text-white text-sm">{format(new Date(charge.createdAt), 'dd.MM.yyyy HH:mm')}</dd>
              </div>
            </dl>
          </div>
          {charge.caseFile && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Verknüpfte Parteiakte</h3>
              <Link href={`/dashboard/case-files/${charge.caseFile.id}`}
                className="text-blue-400 hover:text-blue-300 font-mono text-sm">
                {charge.caseFile.caseNumber}
              </Link>
              <p className="text-slate-400 text-xs mt-1">{charge.caseFile.title}</p>
            </div>
          )}
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
