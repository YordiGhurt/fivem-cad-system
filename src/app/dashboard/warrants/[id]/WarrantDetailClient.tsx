'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Aktiv',
  EXPIRED: 'Abgelaufen',
  SERVED: 'Vollstreckt',
};
const statusColors: Record<string, string> = {
  ACTIVE: 'bg-red-500/20 text-red-400 border border-red-500/30',
  EXPIRED: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  SERVED: 'bg-green-500/20 text-green-400 border border-green-500/30',
};

interface WarrantDetailClientProps {
  warrant: {
    id: string;
    citizenName: string;
    citizenId: string | null;
    reason: string;
    charges: string;
    status: string;
    pdfUrl: string | null;
    issuedBy: { id: string; username: string };
    expiresAt: Date | null;
    createdAt: Date;
  };
  isAdmin?: boolean;
}

export function WarrantDetailClient({ warrant, isAdmin }: WarrantDetailClientProps) {
  const router = useRouter();
  const [pdfUrl, setPdfUrl] = useState(warrant.pdfUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!confirm('Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;
    try {
      const res = await fetch(`/api/warrants/${warrant.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/dashboard/warrants');
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
      const res = await fetch(`/api/warrants/${warrant.id}/pdf`, { method: 'POST' });
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
        <Link href="/dashboard/warrants" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Zurück zu Haftbefehlen
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[warrant.status] ?? 'bg-slate-500/20 text-slate-400'}`}>
              {statusLabels[warrant.status] ?? warrant.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{warrant.citizenName}</h1>
          {warrant.citizenId && <p className="text-slate-400 text-sm mt-1">ID: {warrant.citizenId}</p>}
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
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Begründung</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{warrant.reason}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Anklagepunkte</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{warrant.charges}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Haftbefehl-ID</dt>
                <dd className="text-white text-xs font-mono break-all">{warrant.id}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Status</dt>
                <dd className="text-white text-sm">{statusLabels[warrant.status] ?? warrant.status}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Ausgestellt von</dt>
                <dd className="text-white text-sm">{warrant.issuedBy.username}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Ausgestellt am</dt>
                <dd className="text-white text-sm">{format(new Date(warrant.createdAt), 'dd.MM.yyyy HH:mm')}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Gültig bis</dt>
                <dd className="text-white text-sm">
                  {warrant.expiresAt ? format(new Date(warrant.expiresAt), 'dd.MM.yyyy HH:mm') : 'Unbefristet'}
                </dd>
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
