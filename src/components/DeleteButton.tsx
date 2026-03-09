'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

interface DeleteButtonProps {
  id: string;
  endpoint: string;
  confirmMessage?: string;
  redirectTo?: string;
}

export function DeleteButton({ id, endpoint, confirmMessage, redirectTo }: DeleteButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(confirmMessage ?? 'Wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return;

    setDeleting(true);
    try {
      const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } else {
        const json = await res.json().catch(() => ({}));
        alert('Fehler beim Löschen: ' + (json.error ?? 'Unbekannter Fehler'));
      }
    } catch (err) {
      alert('Fehler beim Löschen: ' + err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors disabled:opacity-50"
      title="Löschen"
    >
      <Trash2 size={16} />
    </button>
  );
}
