'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';
import RankPermissionsModal, { OrgRank } from '@/components/RankPermissionsModal';

interface Props {
  orgId: string;
  ranks: OrgRank[];
  canEdit: boolean;
}

export default function RanksWithPermissions({ orgId, ranks, canEdit }: Props) {
  const [selectedRank, setSelectedRank] = useState<OrgRank | null>(null);
  const [rankList, setRankList] = useState<OrgRank[]>(ranks);

  const handleSave = (updated: OrgRank) => {
    setRankList((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <>
      <div className="divide-y divide-slate-800">
        {rankList.length === 0 && (
          <p className="text-slate-400 text-sm px-5 py-4">Keine Ränge definiert</p>
        )}
        {rankList.map((rank) => (
          <div key={rank.id} className="px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: rank.color }}
              />
              <span className="text-white text-sm">{rank.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">Level {rank.level}</span>
              <button
                onClick={() => setSelectedRank(rank)}
                className="text-slate-500 hover:text-blue-400 transition-colors"
                title="Berechtigungen anzeigen"
              >
                <Shield className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedRank && (
        <RankPermissionsModal
          orgId={orgId}
          rank={selectedRank}
          readOnly={!canEdit}
          onClose={() => setSelectedRank(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
