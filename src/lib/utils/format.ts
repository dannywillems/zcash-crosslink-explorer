const ZATOSHI_PER_ZEC = 100_000_000;

export function formatZec(zatoshis: number): string {
  const zec = zatoshis / ZATOSHI_PER_ZEC;
  return zec.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  });
}

export function truncateHash(
  hash: string,
  prefixLen: number = 8,
  suffixLen: number = 8,
): string {
  if (hash.length <= prefixLen + suffixLen + 3) return hash;
  return `${hash.slice(0, prefixLen)}...${hash.slice(-suffixLen)}`;
}

export function formatTimeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 0) return 'in the future';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  // For very old timestamps, show the actual date
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function formatHashRate(hps: number): string {
  if (hps >= 1e18) return `${(hps / 1e18).toFixed(2)} EH/s`;
  if (hps >= 1e15) return `${(hps / 1e15).toFixed(2)} PH/s`;
  if (hps >= 1e12) return `${(hps / 1e12).toFixed(2)} TH/s`;
  if (hps >= 1e9) return `${(hps / 1e9).toFixed(2)} GH/s`;
  if (hps >= 1e6) return `${(hps / 1e6).toFixed(2)} MH/s`;
  if (hps >= 1e3) return `${(hps / 1e3).toFixed(2)} KH/s`;
  return `${hps.toFixed(2)} H/s`;
}

export function formatDifficulty(d: number): string {
  if (d >= 1e12) return `${(d / 1e12).toFixed(2)}T`;
  if (d >= 1e9) return `${(d / 1e9).toFixed(2)}G`;
  if (d >= 1e6) return `${(d / 1e6).toFixed(2)}M`;
  if (d >= 1e3) return `${(d / 1e3).toFixed(2)}K`;
  return d.toFixed(2);
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(2)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(2)} KB`;
  return `${bytes} B`;
}

export function toHex(value: unknown): string {
  if (typeof value === 'string') {
    // Already a hex string
    if (/^[0-9a-fA-F]+$/.test(value)) return value;
    return value;
  }
  if (Array.isArray(value)) {
    // Byte array like [189, 60, 207, ...]
    return value.map((b: number) => b.toString(16).padStart(2, '0')).join('');
  }
  return String(value);
}

export function isBlockHash(s: string): boolean {
  return /^[0-9a-fA-F]{64}$/.test(s);
}

export function isBlockHeight(s: string): boolean {
  return /^\d+$/.test(s) && parseInt(s, 10) >= 0;
}
