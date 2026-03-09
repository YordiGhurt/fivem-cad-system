'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

const typeLabels: Record<string, string> = {
  GUILTY: 'Schuldig',
  NOT_GUILTY: 'Nicht schuldig',
  PLEA_DEAL: 'Geständnisvereinbarung',
  DISMISSED: 'Eingestellt',
};
const typeColors: Record<string, string> = {
  GUILTY: 'bg-red-500/20 text-red-400 border border-red-500/30',
  NOT_GUILTY: 'bg-green-500/20 text-green-400 border border-green-500/30',
  PLEA_DEAL: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  DISMISSED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

interface VerdictDetailClientProps {
  verdict: {
    id: string;
    caseNumber: string;
    citizenName: string;
    citizenId: string | null;
    type: string;
    sentence: string | null;
    jailTime: number | null;
    fineAmount: number | null;
    judge: { id: string; username: string };
    caseFile: { id: string; caseNumber: string; title: string } | null;
    notes: string | null;
    pdfUrl: string | null;
    issuedAt: Date;
    updatedAt: Date;
  };
  isAdmin?: boolean;
}

export function VerdictDetailClient({ verdict, isAdmin }: VerdictDetailClientProps) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState(verdict.pdfUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!confirm('Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
    try {
      const res = await fetch(`/api/verdicts/${verdict.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/verdicts');
      } else {
        const json = await res.json().catch(() => ({}));
        alert('Fehler beim Löschen: ' + (json.error ?? 'Unbekannter Fehler'));
      }
    } catch (err) {
      alert('Fehler beim Löschen: ' + err);
    }
  }

  async function handleGeneratePDF() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/verdicts/${verdict.id}/pdf`, { method: 'POST' });
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
        <Link href="/dashboard/verdicts" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Zurück zu Urteilen
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${typeColors[verdict.type] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {typeLabels[verdict.type] ?? verdict.type}
            </span>
            <span className="text-xs text-slate-400 font-mono">{verdict.caseNumber}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{verdict.citizenName}</h1>
          {verdict.citizenId && <p className="text-slate-400 text-sm mt-1">ID: {verdict.citizenId}</p>}
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <button onClick={handleDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
              title="Löschen">
              <Trash2 size={18} />
            </button>
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
          {(verdict.jailTime || verdict.fineAmount) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Strafe</h2>
              <div className="grid grid-cols-2 gap-4">
                {verdict.jailTime != null && (
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">{verdict.jailTime} Mon.</div>
                    <div className="text-slate-400 text-xs mt-1">Haftzeit</div>
                  </div>
                )}
                {verdict.fineAmount != null && (
                  <div className="bg-slate-800 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-white">${verdict.fineAmount.toLocaleString('de-DE')}</div>
                    <div className="text-slate-400 text-xs mt-1">Geldstrafe</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {verdict.sentence && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Urteilsbegründung</h2>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: verdict.sentence }} />
            </div>
          )}
          {verdict.notes && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Notizen</h2>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: verdict.notes }} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Urteil-ID</dt>
                <dd className="text-white text-xs font-mono break-all">{verdict.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Richter</dt>
                <dd className="text-white text-sm">{verdict.judge.username}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Urteilsdatum</dt>
                <dd className="text-white text-sm">{format(new Date(verdict.issuedAt), 'dd.MM.yyyy HH:mm')}</dd>
              </div>
            </dl>
          </div>
          {verdict.caseFile && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Verknüpfte Parteiakte</h3>
              <Link href={`/dashboard/case-files/${verdict.caseFile.id}`}
                className="text-blue-400 hover:text-blue-300 font-mono text-sm">
                {verdict.caseFile.caseNumber}
              </Link>
              <p className="text-slate-400 text-xs mt-1">{verdict.caseFile.title}</p>
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
