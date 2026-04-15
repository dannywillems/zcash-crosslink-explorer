<script lang="ts">
  import { page } from '$app/state';
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import { getAddressBalance, getAddressUtxos } from '$lib/api/addresses.js';
  import { getAddressTxIds } from '$lib/api/transactions.js';
  import { connected } from '$lib/stores/endpoint.js';
  import { base } from '$app/paths';
  import HashLink from '$lib/components/common/HashLink.svelte';
  import { formatZec } from '$lib/utils/format.js';
  import type { AddressBalance, AddressUtxo } from '$lib/types/index.js';

  let balance = $state<AddressBalance | null>(null);
  let utxos = $state<AddressUtxo[]>([]);
  let txids = $state<string[]>([]);
  let loading = $state(false);
  let error = $state('');
  let indexerRequired = $state(false);

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v) load();
  });

  let address = $derived(page.params.address);

  $effect(() => {
    if (isConnected && address) load();
  });

  let queries = $derived([
    {
      method: 'getaddressbalance',
      params: [{ addresses: [address ?? ''] }],
      description: 'Address balance (requires indexing)',
    },
    {
      method: 'getaddresstxids',
      params: [{ addresses: [address ?? ''] }],
      description: 'Transaction IDs for address',
    },
    {
      method: 'getaddressutxos',
      params: [{ addresses: [address ?? ''] }],
      description: 'Unspent outputs for address',
    },
    {
      method: 'validateaddress',
      params: [address ?? ''],
      description: 'Validate address format',
    },
  ]);

  async function load(): Promise<void> {
    const addr = address ?? '';
    if (!addr) return;
    loading = true;
    error = '';
    indexerRequired = false;

    const results = await Promise.allSettled([
      getAddressBalance([addr]),
      getAddressUtxos([addr]),
      getAddressTxIds([addr]),
    ]);

    if (results[0].status === 'fulfilled') {
      balance = results[0].value;
    } else {
      const msg =
        results[0].reason instanceof Error ? results[0].reason.message : '';
      if (
        msg.includes('not available') ||
        msg.includes('not found') ||
        msg.includes('-1')
      ) {
        indexerRequired = true;
      }
    }

    if (results[1].status === 'fulfilled') {
      utxos = results[1].value;
    }
    if (results[2].status === 'fulfilled') {
      txids = results[2].value;
    }

    if (results.every(r => r.status === 'rejected') && !indexerRequired) {
      error =
        'Could not load address data. The node may not ' +
        'support address indexing.';
      indexerRequired = true;
    }

    loading = false;
  }
</script>

<svelte:head>
  <title>
    Address {(address ?? '').slice(0, 12)}... - Zcash Crosslink Explorer
  </title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-xl font-bold">Address</h1>
    <p class="mt-1 font-mono text-sm break-all">
      {address}
    </p>
  </div>

  {#if !isConnected}
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-8 text-center"
    >
      <p class="text-[var(--fg-muted)]">
        Connect to a node to view address data
      </p>
    </div>
  {:else if loading}
    <LoadingSpinner text="Loading address..." />
  {:else if indexerRequired}
    <div
      class="rounded-lg border border-[var(--color-warning)]/30
             bg-[var(--color-warning)]/10 p-6"
    >
      <p class="font-medium text-[var(--color-warning)]">
        Address indexing not available
      </p>
      <p class="mt-2 text-sm text-[var(--fg-muted)]">
        The connected node does not support address queries. Address lookups
        require either:
      </p>
      <ul
        class="mt-2 list-disc pl-5 text-sm
               text-[var(--fg-muted)]"
      >
        <li>
          Zebra running with
          <code class="text-[var(--color-primary)]"> -addressindex </code>
          enabled
        </li>
        <li>
          An external indexer like
          <strong>Zaino</strong>
        </li>
      </ul>
      <p class="mt-3 text-sm text-[var(--fg-muted)]">
        Use the RPC debug panel below to inspect raw responses.
      </p>
    </div>
  {:else if error}
    <ErrorMessage message={error} />
  {:else}
    <!-- Balance -->
    {#if balance}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <h2 class="text-sm font-semibold">Balance</h2>
        <div class="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-[var(--fg-muted)]">Total</p>
            <p class="font-mono text-lg font-bold">
              {formatZec(balance.balance)} ZEC
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--fg-muted)]">Received</p>
            <p class="font-mono text-lg">
              {formatZec(balance.received)} ZEC
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Transactions -->
    {#if txids.length > 0}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)]"
      >
        <div class="border-b border-[var(--bd)] px-4 py-3">
          <h2 class="font-semibold">
            Transactions ({txids.length})
          </h2>
        </div>
        <div class="divide-y divide-[var(--bd)]/50">
          {#each txids.slice(0, 50) as txid}
            <div
              class="px-4 py-2
                     hover:bg-[var(--color-primary)]/5
                     transition-colors"
            >
              <HashLink
                hash={txid}
                type="transaction"
                prefixLen={16}
                suffixLen={16}
              />
            </div>
          {/each}
          {#if txids.length > 50}
            <div class="px-4 py-2 text-sm text-[var(--fg-muted)]">
              ... and {txids.length - 50} more
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- UTXOs -->
    {#if utxos.length > 0}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)]"
      >
        <div class="border-b border-[var(--bd)] px-4 py-3">
          <h2 class="font-semibold">
            UTXOs ({utxos.length})
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="border-b border-[var(--bd)]
                       text-left text-xs uppercase
                       text-[var(--fg-muted)]"
              >
                <th class="px-4 py-2">Tx</th>
                <th class="px-4 py-2">Index</th>
                <th class="px-4 py-2">Height</th>
                <th class="px-4 py-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {#each utxos.slice(0, 50) as utxo}
                <tr
                  class="border-b border-[var(--bd)]/50
                         hover:bg-[var(--color-primary)]/5"
                >
                  <td class="px-4 py-2">
                    <a
                      href="{base}/transaction/{utxo.txid}"
                      class="font-mono text-xs"
                    >
                      {utxo.txid.slice(0, 12)}...
                    </a>
                  </td>
                  <td class="px-4 py-2 tabular-nums">
                    {utxo.outputIndex}
                  </td>
                  <td class="px-4 py-2">
                    <a href="{base}/block/{utxo.height}">
                      {utxo.height}
                    </a>
                  </td>
                  <td
                    class="px-4 py-2 text-right font-mono
                           tabular-nums"
                  >
                    {formatZec(utxo.satoshis)} ZEC
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  {/if}

  <RpcDebug {queries} />
</div>
