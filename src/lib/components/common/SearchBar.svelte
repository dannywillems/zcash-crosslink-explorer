<script lang="ts">
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { isBlockHash, isBlockHeight } from '$lib/utils/format.js';

  let query = $state('');
  let error = $state('');

  function handleSubmit(e: Event): void {
    e.preventDefault();
    error = '';
    const q = query.trim();
    if (!q) return;

    if (isBlockHeight(q)) {
      goto(`${base}/block/${q}`);
    } else if (isBlockHash(q)) {
      goto(`${base}/block/${q}`);
    } else if (q.length === 64) {
      goto(`${base}/transaction/${q}`);
    } else {
      error = 'Enter a block height, block hash, or tx hash';
      return;
    }
    query = '';
  }
</script>

<form onsubmit={handleSubmit} class="flex items-center gap-2">
  <input
    type="text"
    bind:value={query}
    placeholder="Height, block hash, or tx hash"
    class="w-48 rounded-md border border-[var(--bd)]
           bg-[var(--bg)] px-3 py-1.5 text-sm
           text-[var(--fg)] placeholder-[var(--fg-muted)]
           focus:border-[var(--color-primary)]
           focus:outline-none focus:ring-1
           focus:ring-[var(--color-primary)]
           {error ? 'border-[var(--color-danger)]' : ''}"
  />
  <button
    type="submit"
    class="rounded-md bg-[var(--color-primary)] px-3 py-1.5
           text-sm font-medium text-black
           hover:bg-[var(--color-primary-light)]
           transition-colors"
  >
    Search
  </button>
</form>
{#if error}
  <p class="mt-1 text-xs text-[var(--color-danger)]">{error}</p>
{/if}
