'use client';

import { useState, useEffect } from 'react';
import { Users2, Plus, Trash2, X } from 'lucide-react';

interface Unit {
  id: string;
  callsign: string;
  status: string;
  user?: { username: string };
}

interface Patrol {
  id: string;
  name: string;
  unitIds: string[];
  createdAt: string;
}

export default function PatrolsPage() {
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPatrols = () => {
    fetch('/api/patrols')
      .then((r) => r.json())
      .then((d) => setPatrols(d.data ?? []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchPatrols();
    fetch('/api/units')
      .then((r) => r.json())
      .then((d) => setUnits((d.data ?? []).filter((u: Unit) => u.status !== 'OFFDUTY')))
      .catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || selectedUnitIds.length === 0) {
      setError('Name und mindestens eine Einheit erforderlich');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/patrols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, unitIds: selectedUnitIds }),
      });
      if (res.ok) {
        setShowModal(false);
        setNewName('');
        setSelectedUnitIds([]);
        fetchPatrols();
      } else {
        const data = await res.json();
        setError(data.error ?? 'Fehler beim Erstellen');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDissolve = async (id: string) => {
    await fetch(`/api/patrols?id=${id}`, { method: 'DELETE' });
    fetchPatrols();
  };

  const toggleUnit = (unitId: string) => {
    setSelectedUnitIds((prev) =>
      prev.includes(unitId) ? prev.filter((id) => id !== unitId) : [...prev, unitId],
    );
  };

  const getUnitCallsign = (id: string) => units.find((u) => u.id === id)?.callsign ?? id;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users2 className="w-6 h-6 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Patrouillen</h1>
            <p className="text-slate-400 text-sm mt-1">{patrols.length} aktive Patrouille{patrols.length !== 1 ? 'n' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neue Patrouille
        </button>
      </div>

      {patrols.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <Users2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400">Keine aktiven Patrouillen</p>
          <p className="text-slate-600 text-sm mt-1">Erstelle eine neue Patrouille mit dem Button oben rechts</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {patrols.map((patrol) => (
            <div key={patrol.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{patrol.name}</h3>
                <button
                  onClick={() => handleDissolve(patrol.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  title="Patrouille auflösen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {patrol.unitIds.map((unitId) => (
                  <span
                    key={unitId}
                    className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-full"
                  >
                    {getUnitCallsign(unitId)}
                  </span>
                ))}
              </div>
              <p className="text-slate-600 text-xs mt-3">
                Erstellt: {new Date(patrol.createdAt).toLocaleString('de-DE')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* New Patrol Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Neue Patrouille erstellen</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1">Patrouillennamen</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Alpha 1-3"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Einheiten auswählen ({units.length} aktiv)
                </label>
                {units.length === 0 ? (
                  <p className="text-slate-500 text-sm">Keine aktiven Einheiten verfügbar</p>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {units.map((unit) => (
                      <label
                        key={unit.id}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUnitIds.includes(unit.id)}
                          onChange={() => toggleUnit(unit.id)}
                          className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-white text-sm">{unit.callsign}</span>
                        {unit.user && (
                          <span className="text-slate-500 text-xs">{unit.user.username}</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? 'Wird erstellt...' : 'Erstellen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
