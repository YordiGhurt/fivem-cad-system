'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource('/api/sse');

    eventSource.onmessage = () => {
      router.refresh();
    };

    eventSource.onerror = () => {
      // Reconnect is handled automatically by EventSource
    };

    return () => {
      eventSource.close();
    };
  }, [router]);

  return <>{children}</>;
}
