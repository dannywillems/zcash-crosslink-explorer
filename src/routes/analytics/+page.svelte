<script lang="ts">
  import StatCard from '$lib/components/common/StatCard.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import {
    getBlockchainInfo,
    getMiningInfo,
    getMempoolInfo,
    getPeerInfo,
    getNetworkHashPs,
    getDifficulty,
    getBlockRange,
  } from '$lib/api/index.js';
  import {
    formatNumber,
    formatHashRate,
    formatDifficulty,
    formatBytes,
  } from '$lib/utils/format.js';
  import { connected } from '$lib/stores/endpoint.js';
  import type {
    BlockchainInfo,
    MiningInfo,
    MempoolInfo,
    Block,
  } from '$lib/types/index.js';

  let chainInfo = $state<BlockchainInfo | null>(null);
  let miningInfo = $state<MiningInfo | null>(null);
  let mempoolInfo = $state<MempoolInfo | null>(null);
  let peerCount = $state(0);
  let hashRate = $state(0);
  let difficulty = $state(0);
  let recentBlocks = $state<Block[]>([]);
  let avgBlockTime = $state(0);
  let avgTxPerBlock = $state(0);
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
        getMempoolInfo(),
        getPeerInfo(),
        getNetworkHashPs(),
        getDifficulty(),
      ]);

      if (results[0].status === 'fulfilled') chainInfo = results[0].value;
      if (results[1].status === 'fulfilled') miningInfo = results[1].value;
      if (results[2].status === 'fulfilled') mempoolInfo = results[2].value;
      if (results[3].status === 'fulfilled')
        peerCount = results[3].value.length;
      if (results[4].status === 'fulfilled') hashRate = results[4].value;
      if (results[5].status === 'fulfilled') difficulty = results[5].value;

      if (chainInfo) {
        recentBlocks = await getBlockRange(chainInfo.blocks, 50);
        computeStats();
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }

  function computeStats(): void {
    if (recentBlocks.length < 2) return;

    const sorted = [...recentBlocks].sort((a, b) => a.height - b.height);
    let totalTimeDiff = 0;
    let totalTx = 0;

    for (let i = 1; i < sorted.length; i++) {
      totalTimeDiff += sorted[i].time - sorted[i - 1].time;
      totalTx += sorted[i].tx.length;
    }

    avgBlockTime = totalTimeDiff / (sorted.length - 1);
    avgTxPerBlock = totalTx / (sorted.length - 1);
  }

  // Simple SVG bar chart for block sizes
  function blockSizeData(): { height: number; label: string }[] {
    return recentBlocks
      .slice(0, 20)
      .reverse()
      .map(b => ({
        height: b.size,
        label: `#${b.height}`,
      }));
  }
</script>

<svelte:head>
  <title>Analytics - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-6">
  <h1 class="text-2xl font-bold">Network Analytics</h1>

  {#if !isConnected}
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-8 text-center"
    >
      <p class="text-[var(--fg-muted)]">Connect to a node to view analytics</p>
    </div>
  {:else if loading}
    <LoadingSpinner text="Loading analytics..." />
  {:else if error}
    <ErrorMessage message={error} />
  {:else}
    <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard
        label="Block Height"
        value={chainInfo ? formatNumber(chainInfo.blocks) : 'N/A'}
      />
      <StatCard label="Hash Rate" value={formatHashRate(hashRate)} />
      <StatCard label="Difficulty" value={formatDifficulty(difficulty)} />
      <StatCard
        label="Mempool"
        value={mempoolInfo ? `${mempoolInfo.size} txs` : 'N/A'}
        subtext={mempoolInfo ? formatBytes(mempoolInfo.bytes) : ''}
      />
      <StatCard
        label="Avg Block Time"
        value={avgBlockTime > 0 ? `${avgBlockTime.toFixed(0)}s` : 'N/A'}
        subtext="last 50 blocks"
      />
      <StatCard
        label="Avg Tx/Block"
        value={avgTxPerBlock > 0 ? avgTxPerBlock.toFixed(1) : 'N/A'}
        subtext="last 50 blocks"
      />
    </div>

    <!-- Block size chart -->
    {#if recentBlocks.length > 0}
      {@const data = blockSizeData()}
      {@const maxSize = Math.max(...data.map(d => d.height), 1)}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <h3 class="mb-4 text-sm font-semibold">Block Sizes (last 20 blocks)</h3>
        <div class="flex items-end gap-1" style="height: 160px">
          {#each data as bar}
            {@const pct = (bar.height / maxSize) * 100}
            <div class="group relative flex-1" style="height: 100%">
              <div
                class="absolute bottom-0 w-full rounded-t
                       bg-[var(--color-primary)]
                       group-hover:bg-[var(--color-primary-light)]
                       transition-colors"
                style="height: {Math.max(pct, 2)}%"
                title="{bar.label}: {formatBytes(bar.height)}"
              ></div>
            </div>
          {/each}
        </div>
        <div class="mt-1 flex gap-1">
          {#each data as bar}
            <div
              class="flex-1 text-center text-[8px]
                     text-[var(--fg-muted)] truncate"
            >
              {bar.label.replace('#', '')}
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Peer info -->
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-4"
    >
      <h3 class="text-sm font-semibold">
        Network Peers ({peerCount})
      </h3>
    </div>
  {/if}
</div>
