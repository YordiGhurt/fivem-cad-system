export interface FivemQueueEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __fivemQueue: FivemQueueEvent[] | undefined;
}

if (!globalThis.__fivemQueue) {
  globalThis.__fivemQueue = [];
}

export function enqueueEvent(type: string, payload: Record<string, unknown>): void {
  const event: FivemQueueEvent = {
    id: Math.random().toString(36).slice(2),
    type,
    payload,
    createdAt: Date.now(),
  };
  globalThis.__fivemQueue!.push(event);
}

export function drainQueue(): FivemQueueEvent[] {
  const events = globalThis.__fivemQueue ?? [];
  globalThis.__fivemQueue = [];
  return events;
}
