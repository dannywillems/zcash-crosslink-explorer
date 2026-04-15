<script lang="ts">
  import ValidatorRoster from '$lib/components/staking/ValidatorRoster.svelte';
  import StatCard from '$lib/components/common/StatCard.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import {
    getTflFinalBlockHeightAndHash,
    getBlockchainInfo,
  } from '$lib/api/index.js';
  import { connected } from '$lib/stores/endpoint.js';
  import { formatNumber } from '$lib/utils/format.js';
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
      <StatCard
        label="Finalized Height"
        value={formatNumber(finalityInfo.height)}
      />
      <StatCard
        label="Finality Gap"
        value={formatNumber(tipHeight - finalityInfo.height)}
        subtext="blocks behind tip"
      />
      <StatCard
        label="Finalized Hash"
        value={finalityInfo.hash.slice(0, 12) + '...'}
        subtext={finalityInfo.hash}
      />
    </div>
  {:else if loading}
    <LoadingSpinner text="Loading finality info..." />
  {:else if error}
    <ErrorMessage message={error} />
  {/if}

  <ValidatorRoster />
</div>
