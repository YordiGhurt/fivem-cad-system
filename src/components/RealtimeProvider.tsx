'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const es = new EventSource('/api/sse');

    es.onmessage = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        router.refresh();
      }, 500);
    };

    es.onerror = () => {
      // Reconnect is handled automatically by EventSource
    };

    return () => {
      es.close();
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [router]);

  return <>{children}</>;
}
