import { writable } from 'svelte/store';

const STORAGE_KEY = 'zcash-explorer-theme';

type Theme = 'dark' | 'light';

function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export const theme = writable<Theme>(loadTheme());

theme.subscribe(t => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, t);
  document.documentElement.classList.toggle('light', t === 'light');
});

export function toggleTheme(): void {
  theme.update(t => (t === 'dark' ? 'light' : 'dark'));
}
