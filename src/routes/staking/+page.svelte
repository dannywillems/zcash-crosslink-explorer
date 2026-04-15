<script lang="ts">
  import { base } from '$app/paths';
  import ValidatorRoster from '$lib/components/staking/ValidatorRoster.svelte';
  import StatCard from '$lib/components/common/StatCard.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';
  import {
    getTflFinalBlockHeightAndHash,
    getBlockchainInfo,
  } from '$lib/api/index.js';

  const queries = [
    {
      method: 'get_tfl_roster_zec',
      params: [],
      description: 'Validator roster with ZEC amounts',
    },
    {
      method: 'get_tfl_roster_zats',
      params: [],
      description: 'Validator roster with zatoshi amounts',
    },
    {
      method: 'get_tfl_final_block_height_and_hash',
      params: [],
      description: 'Current finalized PoW block',
    },
    {
      method: 'get_tfl_final_block_hash',
      params: [],
      description: 'Finalized block hash only',
    },
    {
      method: 'get_tfl_fat_pointer_to_bft_chain_tip',
      params: [],
      description: 'BFT chain tip pointer',
    },
  ];
  import { connected } from '$lib/stores/endpoint.js';
  import { formatNumber, toHex } from '$lib/utils/format.js';
  import type { FinalityInfo } from '$lib/types/index.js';

  let finalityInfo = $state<FinalityInfo | null>(null);
  let tipHeight = $state(0);
  let loading = $state(false);
  let error = $state('');

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v) load();
  });

  async function load(): Promise<void> {
    loading = true;
    error = '';
    try {
      const [finality, chain] = await Promise.all([
        getTflFinalBlockHeightAndHash(),
        getBlockchainInfo(),
      ]);
      finalityInfo = finality;
      if (finalityInfo) {
        finalityInfo.hash = toHex(finalityInfo.hash);
      }
      tipHeight = chain.blocks;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Staking - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Staking & Finality</h1>

  {#if isConnected && !loading && !error && finalityInfo}
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard label="Tip Height" value={formatNumber(tipHeight)} />
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <p
          class="text-xs font-medium uppercase tracking-wider
                 text-[var(--fg-muted)]"
        >
          Finalized Height
        </p>
        <a
          href="{base}/block/{finalityInfo.height}"
          class="mt-1 block text-2xl font-bold tabular-nums
                 hover:underline"
        >
          {formatNumber(finalityInfo.height)}
        </a>
      </div>
      <StatCard
        label="Finality Gap"
        value={formatNumber(tipHeight - finalityInfo.height)}
        subtext="blocks behind tip"
      />
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <p
          class="text-xs font-medium uppercase tracking-wider
                 text-[var(--fg-muted)]"
        >
          Finalized Hash
        </p>
        <a
          href="{base}/block/{finalityInfo.hash}"
          class="mt-1 block font-mono text-xs font-bold
                 break-all hover:underline"
        >
          {finalityInfo.hash}
        </a>
      </div>
    </div>
  {:else if loading}
    <LoadingSpinner text="Loading finality info..." />
  {:else if error}
    <ErrorMessage message={error} />
  {/if}

  <ValidatorRoster />
  <RpcDebug {queries} />
</div>
