<script lang="ts">
  import { endpoint, connected } from '$lib/stores/endpoint.js';
  import { getBlockchainInfo } from '$lib/api/index.js';

  let url = $state('');
  let testing = $state(false);
  let errorMsg = $state('');

  endpoint.subscribe(v => {
    url = v;
  });

  async function handleConnect(): Promise<void> {
    errorMsg = '';
    const trimmed = url.trim();
    if (!trimmed) {
      errorMsg = 'Enter a URL';
      return;
    }

    testing = true;
    endpoint.set(trimmed);

    try {
      await getBlockchainInfo();
      connected.set(true);
      errorMsg = '';
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : 'Connection failed';
      connected.set(false);
    } finally {
      testing = false;
    }
  }

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
  });
</script>

<div class="flex items-center gap-2">
  <span class="text-xs text-[var(--fg-muted)] shrink-0"> RPC Node: </span>
  <div class="relative">
    <input
      type="text"
      bind:value={url}
      placeholder="http://localhost:8232"
      title={errorMsg || 'JSON-RPC endpoint URL'}
      class="w-56 rounded-md border border-[var(--bd)]
             bg-[var(--bg)] px-3 py-1 text-xs
             font-mono text-[var(--fg)]
             placeholder-[var(--fg-muted)]
             focus:border-[var(--color-primary)]
             focus:outline-none focus:ring-1
             focus:ring-[var(--color-primary)]
             {errorMsg ? 'border-[var(--color-danger)]' : ''}"
    />
    {#if isConnected}
      <span
        class="absolute right-2 top-1/2 -translate-y-1/2
               h-2 w-2 rounded-full bg-[var(--color-success)]"
        title="Connected"
      ></span>
    {/if}
  </div>
  <button
    onclick={handleConnect}
    disabled={testing}
    class="rounded-md border border-[var(--color-primary)]
           px-3 py-1 text-xs font-medium shrink-0
           text-[var(--color-primary)]
           hover:bg-[var(--color-primary)]/10
           disabled:opacity-50 transition-colors"
  >
    {testing ? '...' : 'Connect'}
  </button>
  {#if isConnected}
    <span class="text-xs text-[var(--color-success)] shrink-0">
      Connected
    </span>
  {/if}
</div>
