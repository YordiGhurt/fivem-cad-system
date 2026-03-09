'use client';

import { useState } from 'react';

interface PlateCheckResult {
  plate: string;
  model: string;
  color: string;
  stolen: boolean;
  flagged: boolean;
  flagReason?: string | null;
  owner?: string;
}

export function PlateCheckButton() {
  const [open, setOpen] = useState(false);
  const [plate, setPlate] = useState('');
  const [result, setResult] = useState<PlateCheckResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      const res = await fetch(`/api/vehicles?search=${encodeURIComponent(plate)}&pageSize=1`);
      const data = await res.json();
      const vehicles = data.data ?? [];
      if (vehicles.length === 0) {
        setNotFound(true);
      } else {
        const v = vehicles[0];
        setResult({
          plate: v.plate,
          model: v.model,
          color: v.color,
          stolen: v.stolen,
          flagged: v.flagged,
          flagReason: v.flagReason,
          owner: v.ownerId,
        });
      }
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setResult(null); setNotFound(false); setPlate(''); }}
        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        Kennzeichen prüfen
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Kennzeichen prüfen</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCheck} className="flex gap-2 mb-4">
              <input
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 uppercase"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="KENNZEICHEN..."
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {loading ? '...' : 'Prüfen'}
              </button>
            </form>

            {notFound && (
              <div className="bg-slate-800 rounded-xl p-4 text-center text-slate-400 text-sm">
                Kennzeichen nicht gefunden
              </div>
            )}

            {result && (
              <div className="bg-slate-800 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-400 text-xs mb-0.5">Kennzeichen</div>
                    <div className="text-white font-mono font-bold">{result.plate}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-0.5">Modell</div>
                    <div className="text-white text-sm">{result.model}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-0.5">Farbe</div>
                    <div className="text-white text-sm">{result.color}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-xs mb-0.5">Halter-ID</div>
                    <div className="text-white text-sm font-mono">{result.owner}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {result.stolen ? (
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-full font-semibold">
                      🚨 GESTOHLEN
                    </span>
                  ) : (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full">
                      ✓ Nicht gestohlen
                    </span>
                  )}
                  {result.flagged ? (
                    <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-full font-semibold">
                      ⚠ Markiert{result.flagReason ? `: ${result.flagReason}` : ''}
                    </span>
                  ) : (
                    <span className="text-xs bg-slate-600/20 text-slate-400 border border-slate-600/30 px-3 py-1.5 rounded-full">
                      Nicht markiert
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
