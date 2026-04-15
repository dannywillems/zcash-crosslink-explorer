<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { connected } from '$lib/stores/endpoint.js';
  import { getBlock } from '$lib/api/blocks.js';
  import { getRawTransaction } from '$lib/api/transactions.js';
  import { isBlockHeight } from '$lib/utils/format.js';

  let query = $state('');
  let error = $state('');
  let searching = $state(false);

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
  });

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    error = '';
    const q = query.trim();
    if (!q) return;
    if (!isConnected) {
      error = 'Connect to a node first';
      return;
    }

    // Numeric: always a block height
    if (isBlockHeight(q)) {
      query = '';
      goto(`${base}/block/${q}`);
      return;
    }

    // 64 hex chars: could be block hash or tx hash
    if (/^[0-9a-fA-F]{64}$/.test(q)) {
      searching = true;
      try {
        // Try block first
        await getBlock(q);
        query = '';
        searching = false;
        goto(`${base}/block/${q}`);
        return;
      } catch {
        // Not a block hash, try transaction
      }
      try {
        await getRawTransaction(q);
        query = '';
        searching = false;
        goto(`${base}/transaction/${q}`);
        return;
      } catch {
        // Neither
      }
      searching = false;
      error = 'No block or transaction found for this hash';
      return;
    }

    error = 'Enter a block height or 64-char hex hash';
  }
</script>

<form onsubmit={handleSubmit} class="flex items-center gap-2">
  <input
    type="text"
    bind:value={query}
    placeholder="Height, block hash, or tx hash"
    class="w-48 rounded-md border border-[var(--bd)]
           bg-[var(--bg)] px-3 py-1 text-xs
           font-mono text-[var(--fg)]
           placeholder-[var(--fg-muted)]
           focus:border-[var(--color-primary)]
           focus:outline-none focus:ring-1
           focus:ring-[var(--color-primary)]
           {error ? 'border-[var(--color-danger)]' : ''}"
  />
  <button
    type="submit"
    disabled={searching}
    class="rounded-md bg-[var(--color-primary)] px-3 py-1
           text-xs font-medium text-black
           hover:bg-[var(--color-primary-light)]
           disabled:opacity-50 transition-colors"
  >
    {searching ? '...' : 'Search'}
  </button>
</form>
{#if error}
  <p
    class="mt-1 text-xs text-[var(--color-danger)]
           max-w-xs truncate"
    title={error}
  >
    {error}
  </p>
{/if}
