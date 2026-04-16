<script lang="ts">
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';
  import StatCard from '$lib/components/common/StatCard.svelte';

  const queries = [
    {
      method: 'getblockchaininfo',
      params: [],
      description: 'Chain info, height, difficulty',
    },
    {
      method: 'getmininginfo',
      params: [],
      description: 'Mining stats and hash rate',
    },
    {
      method: 'getrawmempool',
      params: [],
      description: 'Mempool transaction list',
    },
    {
      method: 'getnetworksolps',
      params: [120, -1],
      description: 'Network solution rate',
    },
    {
      method: 'getdifficulty',
      params: [],
      description: 'Current difficulty',
    },
    {
      method: 'getpeerinfo',
      params: [],
      description: 'Connected peers',
    },
    {
      method: 'getinfo',
      params: [],
      description: 'General node info',
    },
  ];

  import {
    getBlockchainInfo,
    getMiningInfo,
    getRawMempool,
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
    PeerInfo,
    Block,
  } from '$lib/types/index.js';
  import { formatTimeAgo } from '$lib/utils/format.js';

  // Per-section state
  let chainInfo = $state<BlockchainInfo | null>(null);
  let loadingChain = $state(false);

  let miningInfo = $state<MiningInfo | null>(null);
  let hashRate = $state(0);
  let difficulty = $state(0);
  let mempoolSize = $state(0);
  let loadingStats = $state(false);

  let peers = $state<PeerInfo[]>([]);
  let loadingPeers = $state(false);

  let recentBlocks = $state<Block[]>([]);
  let avgBlockTime = $state(0);
  let avgTxPerBlock = $state(0);
  let loadingBlocks = $state(false);

  let isConnected = $state(false);
  let loaded = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v && !loaded) {
      loaded = true;
      loadAll();
    }
  });

  function loadAll(): void {
    loadChainInfo();
    loadOtherStats();
    loadPeers();
  }

  async function loadChainInfo(): Promise<void> {
    loadingChain = true;
    try {
      chainInfo = await getBlockchainInfo();
    } catch {
      // handled per-section
    } finally {
      loadingChain = false;
    }
    // Once we have chain info, load blocks
    if (chainInfo) {
      loadBlocks(chainInfo.blocks);
    }
  }

  async function loadOtherStats(): Promise<void> {
    loadingStats = true;
    try {
      const results = await Promise.allSettled([
        getMiningInfo(),
        getRawMempool(false) as Promise<string[]>,
        getNetworkHashPs(),
        getDifficulty(),
      ]);
      if (results[0].status === 'fulfilled') miningInfo = results[0].value;
      if (results[1].status === 'fulfilled')
        mempoolSize = results[1].value.length;
      if (results[2].status === 'fulfilled') hashRate = results[2].value;
      if (results[3].status === 'fulfilled') difficulty = results[3].value;
    } catch {
      // individual failures handled by allSettled
    } finally {
      loadingStats = false;
    }
  }

  async function loadPeers(): Promise<void> {
    loadingPeers = true;
    try {
      peers = await getPeerInfo();
    } catch {
      // handled per-section
    } finally {
      loadingPeers = false;
    }
  }

  async function loadBlocks(height: number): Promise<void> {
    loadingBlocks = true;
    try {
      recentBlocks = await getBlockRange(height, 50);
      computeStats();
    } catch {
      // handled per-section
    } finally {
      loadingBlocks = false;
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

  function blockSizeData(): {
    height: number;
    label: string;
  }[] {
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
  {:else}
    <!-- Stats cards -->
    <div
      class="grid grid-cols-2 gap-4 md:grid-cols-3
             lg:grid-cols-6"
    >
      {#if loadingChain}
        <StatCard label="Block Height" value="..." />
      {:else}
        <StatCard
          label="Block Height"
          value={chainInfo ? formatNumber(chainInfo.blocks) : 'N/A'}
        />
      {/if}
      {#if loadingStats}
        <StatCard label="Hash Rate" value="..." />
        <StatCard label="Difficulty" value="..." />
        <StatCard label="Mempool" value="..." />
      {:else}
        <StatCard label="Hash Rate" value={formatHashRate(hashRate)} />
        <StatCard label="Difficulty" value={formatDifficulty(difficulty)} />
        <StatCard
          label="Mempool"
          value={mempoolSize > 0 ? `${mempoolSize} txs` : 'N/A'}
        />
      {/if}
      {#if loadingBlocks}
        <StatCard label="Avg Block Time" value="..." subtext="last 50 blocks" />
        <StatCard label="Avg Tx/Block" value="..." subtext="last 50 blocks" />
      {:else}
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
      {/if}
    </div>

    <!-- Block size chart -->
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-4"
    >
      <h3 class="mb-4 text-sm font-semibold">Block Sizes (last 20 blocks)</h3>
      {#if loadingBlocks}
        <div
          class="flex h-40 items-center justify-center
                 text-sm text-[var(--fg-muted)]"
        >
          Loading blocks...
        </div>
      {:else if recentBlocks.length > 0}
        {@const data = blockSizeData()}
        {@const maxSize = Math.max(...data.map(d => d.height), 1)}
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
      {:else}
        <p class="text-sm text-[var(--fg-muted)]">No block data available</p>
      {/if}
    </div>

    <!-- Peer info -->
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-4"
    >
      <h3 class="mb-3 text-sm font-semibold">
        Network Peers
        {#if !loadingPeers}({peers.length}){/if}
      </h3>
      {#if loadingPeers}
        <p class="text-sm text-[var(--fg-muted)]">Loading peers...</p>
      {:else if peers.length > 0}
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr
                class="border-b border-[var(--bd)]
                       text-left text-xs
                       text-[var(--fg-muted)]"
              >
                <th class="pb-2 pr-4">Address</th>
                <th class="pb-2 pr-4">Client</th>
                <th class="pb-2 pr-4">Direction</th>
                <th class="pb-2 pr-4 text-right"> Height </th>
                <th class="pb-2 pr-4 text-right"> Ping </th>
                <th class="pb-2 text-right"> Connected </th>
              </tr>
            </thead>
            <tbody>
              {#each peers as peer}
                <tr
                  class="border-b border-[var(--bd)]
                         last:border-0"
                >
                  <td
                    class="py-2 pr-4 font-mono
                           text-xs"
                  >
                    {peer.addr ?? '-'}
                  </td>
                  <td
                    class="py-2 pr-4 text-xs
                           text-[var(--fg-muted)]"
                  >
                    {(peer.subver ?? '').replace(/\//g, '')}
                  </td>
                  <td class="py-2 pr-4 text-xs">
                    <span
                      class="rounded px-1.5 py-0.5
                             text-xs {peer.inbound
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'}"
                    >
                      {peer.inbound ? 'in' : 'out'}
                    </span>
                  </td>
                  <td
                    class="py-2 pr-4 text-right
                           font-mono text-xs"
                  >
                    {peer.synced_blocks != null
                      ? formatNumber(peer.synced_blocks)
                      : '-'}
                  </td>
                  <td
                    class="py-2 pr-4 text-right
                           text-xs"
                  >
                    {peer.pingtime
                      ? `${(peer.pingtime * 1000).toFixed(0)}ms`
                      : '-'}
                  </td>
                  <td
                    class="py-2 text-right text-xs
                           text-[var(--fg-muted)]"
                  >
                    {peer.conntime ? formatTimeAgo(peer.conntime) : '-'}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <p class="text-sm text-[var(--fg-muted)]">No peers connected</p>
      {/if}
    </div>
    <RpcDebug {queries} />
  {/if}
</div>
