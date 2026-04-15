<script lang="ts">
  import { page } from '$app/state';
  import TransactionDetail from '$lib/components/transactions/TransactionDetail.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';
  import { getRawTransaction } from '$lib/api/index.js';
  import { connected } from '$lib/stores/endpoint.js';
  import type { RawTransaction } from '$lib/types/index.js';

  let tx = $state<RawTransaction | null>(null);
  let loading = $state(false);
  let error = $state('');

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v) load();
  });

  let hash = $derived(page.params.hash);

  $effect(() => {
    if (isConnected && hash) load();
  });

  async function load(): Promise<void> {
    loading = true;
    error = '';
    try {
      const h = hash ?? '';
      if (!h) return;
      tx = await getRawTransaction(h, 1);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>
    Transaction {(hash ?? '').slice(0, 12)}... - Zcash Crosslink Explorer
  </title>
</svelte:head>

{#if !isConnected}
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-8 text-center"
  >
    <p class="text-[var(--fg-muted)]">
      Connect to a node to view transaction details
    </p>
  </div>
{:else if loading}
  <LoadingSpinner text="Loading transaction..." />
{:else if error}
  <ErrorMessage message={error} />
{:else if tx}
  <TransactionDetail {tx} />
  <RpcDebug
    queries={[
      {
        method: 'getrawtransaction',
        params: [tx.txid, 1],
        description: 'Verbose transaction data',
      },
      {
        method: 'get_tfl_tx_finality_from_hash',
        params: [tx.txid],
        description: 'Transaction finality status',
      },
    ]}
  />
{/if}
