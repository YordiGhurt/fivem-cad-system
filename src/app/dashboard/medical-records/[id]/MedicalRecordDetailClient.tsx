'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DeleteButton } from '@/components/DeleteButton';

interface MedicalRecordDetailClientProps {
  record: {
    id: string;
    recordNumber: string;
    citizenName: string;
    citizenId: string | null;
    diagnosis: string;
    treatment: string | null;
    medications: string | null;
    bloodType: string | null;
    allergies: string | null;
    author: { id: string; username: string };
    organization: { id: string; name: string; callsign: string };
    confidential: boolean;
    pdfUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  isAdmin?: boolean;
}

export function MedicalRecordDetailClient({ record, isAdmin }: MedicalRecordDetailClientProps) {
  const [pdfUrl, setPdfUrl] = useState(record.pdfUrl);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  async function handleGeneratePDF() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`/api/medical-records/${record.id}/pdf`, { method: 'POST' });
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
        <Link href="/dashboard/medical-records" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Zurück zu Med. Akten
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {record.confidential && (
              <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-full font-semibold">
                VERTRAULICH
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">{record.recordNumber}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{record.citizenName}</h1>
          {record.citizenId && <p className="text-slate-400 text-sm mt-1">ID: {record.citizenId}</p>}
        </div>
        <div className="flex gap-3">
          {isAdmin && (
            <DeleteButton
              id={record.id}
              endpoint="/api/medical-records"
              redirectTo="/dashboard/medical-records"
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
          {(record.bloodType || record.allergies) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Vitalinformationen</h2>
              <div className="grid grid-cols-2 gap-4">
                {record.bloodType && (
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">Blutgruppe</div>
                    <div className="text-white font-bold text-lg">{record.bloodType}</div>
                  </div>
                )}
                {record.allergies && (
                  <div className="bg-slate-800 rounded-lg p-3">
                    <div className="text-slate-400 text-xs mb-1">Allergien</div>
                    <div className="text-white text-sm">{record.allergies}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-white font-semibold mb-3">Diagnose</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: record.diagnosis }} />
          </div>
          {record.treatment && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Behandlung</h2>
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: record.treatment }} />
            </div>
          )}
          {record.medications && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-3">Medikamente</h2>
              <p className="text-slate-300 text-sm">{record.medications}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-slate-400 text-xs font-medium uppercase mb-3">Details</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-slate-500 text-xs">Aktennummer</dt>
                <dd className="text-white text-sm font-mono">{record.recordNumber}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Behandelnder Arzt</dt>
                <dd className="text-white text-sm">{record.author.username}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Organisation</dt>
                <dd className="text-white text-sm">{record.organization.callsign} – {record.organization.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500 text-xs">Erstellt am</dt>
                <dd className="text-white text-sm">{format(new Date(record.createdAt), 'dd.MM.yyyy HH:mm')}</dd>
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
