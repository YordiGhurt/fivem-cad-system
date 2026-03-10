import { EventEmitter } from 'events';

declare global {
  // eslint-disable-next-line no-var
  var __sseEmitter: EventEmitter | undefined;
}

const emitter: EventEmitter = globalThis.__sseEmitter ?? new EventEmitter();
emitter.setMaxListeners(100);

if (!globalThis.__sseEmitter) {
  globalThis.__sseEmitter = emitter;
}

export { emitter };
