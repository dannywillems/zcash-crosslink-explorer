import { writable, get } from 'svelte/store';
import { setEndpoint } from '$lib/api/index.js';

const STORAGE_KEY = 'zcash-explorer-endpoint';

function loadFromStorage(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEY) || '';
}

export const endpoint = writable<string>(loadFromStorage());
export const connected = writable<boolean>(false);

endpoint.subscribe(url => {
  if (typeof window !== 'undefined' && url) {
    localStorage.setItem(STORAGE_KEY, url);
  }
  setEndpoint(url);
});

export function updateEndpoint(url: string): void {
  endpoint.set(url);
}

export function getStoredEndpoint(): string {
  return get(endpoint);
}

export async function autoConnect(): Promise<void> {
  const url = get(endpoint);
  if (!url) return;

  setEndpoint(url);
  try {
    const { getBlockchainInfo } = await import('$lib/api/blocks.js');
    await getBlockchainInfo();
    connected.set(true);
  } catch {
    // Silently fail; user can click Connect manually
  }
}
