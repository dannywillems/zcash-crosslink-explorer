<script lang="ts">
  import StatCard from '$lib/components/common/StatCard.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import {
    getBlockchainInfo,
    getMiningInfo,
    getTflFinalBlockHeightAndHash,
    getPeerInfo,
  } from '$lib/api/index.js';
  import {
    formatNumber,
    formatDifficulty,
    formatHashRate,
  } from '$lib/utils/format.js';
  import { connected } from '$lib/stores/endpoint.js';
  import type {
    BlockchainInfo,
    MiningInfo,
    FinalityInfo,
  } from '$lib/types/index.js';

  let chainInfo = $state<BlockchainInfo | null>(null);
  let miningInfo = $state<MiningInfo | null>(null);
  let finalityInfo = $state<FinalityInfo | null>(null);
  let peerCount = $state<number>(0);
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
      const results = await Promise.allSettled([
        getBlockchainInfo(),
        getMiningInfo(),
        getTflFinalBlockHeightAndHash(),
        getPeerInfo(),
      ]);

      if (results[0].status === 'fulfilled') chainInfo = results[0].value;
      if (results[1].status === 'fulfilled') miningInfo = results[1].value;
      if (results[2].status === 'fulfilled') finalityInfo = results[2].value;
      if (results[3].status === 'fulfilled')
        peerCount = results[3].value.length;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }
</script>

{#if !isConnected}
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-8 text-center"
  >
    <p class="text-lg text-[var(--fg-muted)]">
      Connect to a Zcash Crosslink node to begin exploring
    </p>
    <p class="mt-2 text-sm text-[var(--fg-muted)]">
      Enter an RPC endpoint URL above and click Connect
    </p>
  </div>
{:else if loading}
  <LoadingSpinner text="Loading network stats..." />
{:else if error}
  <ErrorMessage message={error} />
{:else if chainInfo}
  <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
    <StatCard label="Chain" value={chainInfo.chain} />
    <StatCard label="Block Height" value={formatNumber(chainInfo.blocks)} />
    <StatCard
      label="Difficulty"
      value={formatDifficulty(chainInfo.difficulty)}
    />
    <StatCard
      label="Finalized"
      value={finalityInfo ? formatNumber(finalityInfo.height) : 'N/A'}
      subtext={finalityInfo
        ? `${chainInfo.blocks - finalityInfo.height} behind tip`
        : ''}
    />
    <StatCard
      label="Hash Rate"
      value={miningInfo ? formatHashRate(miningInfo.networkhashps) : 'N/A'}
    />
    <StatCard label="Peers" value={String(peerCount)} />
  </div>
{/if}
