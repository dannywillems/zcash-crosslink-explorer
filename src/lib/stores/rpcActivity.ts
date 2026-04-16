import { writable } from 'svelte/store';

export interface RpcActivityEntry {
  id: number;
  method: string;
  params: unknown[];
  status: 'pending' | 'ok' | 'error';
  startedAt: number;
  duration?: number;
  error?: string;
  response?: unknown;
}

const MAX_ENTRIES = 100;
let nextId = 0;

const { subscribe, update } = writable<RpcActivityEntry[]>([]);

export const rpcActivity = { subscribe };

export function rpcActivityStart(method: string, params: unknown[]): number {
  const id = nextId++;
  update(entries => {
    const next = [
      {
        id,
        method,
        params,
        status: 'pending' as const,
        startedAt: Date.now(),
      },
      ...entries,
    ];
    if (next.length > MAX_ENTRIES) next.length = MAX_ENTRIES;
    return next;
  });
  return id;
}

export function rpcActivityEnd(
  id: number,
  status: 'ok' | 'error',
  error?: string,
  response?: unknown,
): void {
  update(entries =>
    entries.map(e =>
      e.id === id
        ? {
            ...e,
            status,
            duration: Date.now() - e.startedAt,
            error,
            response,
          }
        : e,
    ),
  );
}

export function clearRpcActivity(): void {
  update(() => []);
}
