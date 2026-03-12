'use client';

import { useState } from 'react';

interface FlagVehicleButtonProps {
  plate: string;
  currentlyFlagged: boolean;
  onSuccess?: () => void;
}

export function FlagVehicleButton({ plate, currentlyFlagged, onSuccess }: FlagVehicleButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [stolen, setStolen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/vehicles/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, flagged: true, flagReason: reason, stolen }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Markieren');
        return;
      }

      setOpen(false);
      setReason('');
      setStolen(false);
      if (onSuccess) onSuccess();
      window.location.reload();
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setLoading(false);
    }
  };

  const handleUnflag = async () => {
    setLoading(true);
    try {
      await fetch('/api/vehicles/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate, flagged: false, stolen: false }),
      });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {currentlyFlagged ? (
        <button
          onClick={handleUnflag}
          disabled={loading}
          className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
          Markierung aufheben
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-2 py-1 rounded transition-colors"
        >
          🚩 Markieren
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-white font-semibold mb-4">Fahrzeug markieren: {plate}</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Grund</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Grund für die Markierung..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stolen}
                  onChange={(e) => setStolen(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-red-500 focus:ring-red-500"
                />
                <span className="text-slate-300 text-sm">Als gestohlen markieren</span>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Wird gespeichert...' : 'Markieren'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
