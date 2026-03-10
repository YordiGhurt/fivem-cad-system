'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

interface ReportDetailClientProps {
  report: {
    id: string;
    title: string;
    content: string;
    type: string;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; username: string };
    incident: { id: string; caseNumber: string; type: string } | null;
  };
  isAdmin?: boolean;
}

export function ReportDetailClient({ report, isAdmin }: ReportDetailClientProps) {
  const [pdfUrl, setPdfUrl] = useState(report.pdfUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGeneratePDF() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/${report.id}/pdf`, { method: 'POST' });
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
        <Link
          href="/dashboard/reports"
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Zurück zu Berichten
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-full">
              {report.type}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{report.title}</h1>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <DeleteButton
              id={report.id}
              endpoint="/api/reports"
              redirectTo="/dashboard/reports"
            />
          )}
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              PDF herunterladen
            </a>
          ) : (
            <button
              onClick={handleGeneratePDF}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {generating ? 'Generiere PDF...' : 'PDF generieren'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-4">Inhalt</h2>
            <div className="text-slate-300 text-sm leading-relaxed prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: report.content }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Bericht-ID</dt>
                <dd className="text-white text-xs font-mono break-all">{report.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Typ</dt>
                <dd className="text-white text-sm">{report.type}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Autor</dt>
                <dd className="text-white text-sm">{report.author.username}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Erstellt</dt>
                <dd className="text-white text-sm">
                  {format(new Date(report.createdAt), 'dd.MM.yyyy HH:mm')}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Aktualisiert</dt>
                <dd className="text-white text-sm">
                  {format(new Date(report.updatedAt), 'dd.MM.yyyy HH:mm')}
                </dd>
              </div>
            </dl>
          </div>

          {report.incident && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Verknüpfter Einsatz</h3>
              <Link
                href={`/dashboard/incidents/${report.incident.id}`}
                className="text-blue-400 hover:text-blue-300 font-mono text-sm"
              >
                {report.incident.caseNumber}
              </Link>
              <p className="text-slate-400 text-xs mt-1">{report.incident.type}</p>
            </div>
          )}

          {pdfUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">PDF</h3>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 text-sm break-all"
              >
                PDF herunterladen
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
