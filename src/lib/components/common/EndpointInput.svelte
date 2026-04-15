<script lang="ts">
  import { dev } from '$app/environment';
  import { endpoint, connected } from '$lib/stores/endpoint.js';
  import { getBlockchainInfo } from '$lib/api/index.js';

  let url = $state('');
  let testing = $state(false);
  let errorMsg = $state('');

  endpoint.subscribe(v => {
    url = v;
  });

  async function handleConnect(overrideUrl?: string): Promise<void> {
    errorMsg = '';
    const trimmed = (overrideUrl ?? url).trim();
    if (!trimmed) {
      errorMsg = 'Enter a URL';
      return;
    }

    testing = true;
    url = trimmed;
    endpoint.set(trimmed);

    try {
      await getBlockchainInfo();
      connected.set(true);
      errorMsg = '';
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Connection failed';
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('CORS')
      ) {
        errorMsg =
          'CORS blocked. In dev, use "Local (proxy)" button.' +
          ' In production, use a CORS proxy.';
      } else {
        errorMsg = msg;
      }
      connected.set(false);
    } finally {
      testing = false;
    }
  }

  function connectLocalProxy(): void {
    handleConnect('/rpc-proxy');
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
      onkeydown={e => {
        if (e.key === 'Enter') handleConnect();
      }}
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
    onclick={() => handleConnect()}
    disabled={testing}
    class="rounded-md border border-[var(--color-primary)]
           px-3 py-1 text-xs font-medium shrink-0
           text-[var(--color-primary)]
           hover:bg-[var(--color-primary)]/10
           disabled:opacity-50 transition-colors"
  >
    {testing ? '...' : 'Connect'}
  </button>
  {#if dev}
    <button
      onclick={connectLocalProxy}
      disabled={testing}
      class="rounded-md border border-[var(--fg-muted)]/30
             px-2 py-1 text-xs shrink-0
             text-[var(--fg-muted)]
             hover:text-[var(--fg)]
             hover:border-[var(--fg-muted)]
             disabled:opacity-50 transition-colors"
      title="Connect via Vite dev proxy to 127.0.0.1:8232"
    >
      Local (proxy)
    </button>
  {/if}
  {#if isConnected}
    <span class="text-xs text-[var(--color-success)] shrink-0">
      Connected
    </span>
  {/if}
</div>
{#if errorMsg}
  <p
    class="mt-1 text-xs text-[var(--color-danger)]
           max-w-lg truncate"
    title={errorMsg}
  >
    {errorMsg}
  </p>
{/if}
