<script lang="ts">
  import { base } from '$app/paths';
  import HashLink from '$lib/components/common/HashLink.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';
  import {
    getRawMempool,
    getRawTransaction,
    getBlockchainInfo,
    getBlock,
  } from '$lib/api/index.js';

  const queries = [
    {
      method: 'getrawmempool',
      params: [false],
      description: 'Pending transaction IDs',
    },
    {
      method: 'getrawmempool',
      params: [true],
      description: 'Verbose mempool with fee/size info',
    },
    {
      method: 'getrawtransaction',
      params: ['(txid)', 1],
      description: 'Full transaction data',
    },
  ];
  import { connected } from '$lib/stores/endpoint.js';
  import { formatTimeAgo, formatZec } from '$lib/utils/format.js';
  import type { Block, MempoolInfo, RawTransaction } from '$lib/types/index.js';

  type Tab = 'recent' | 'mempool';

  let activeTab = $state<Tab>('recent');
  let mempoolTxids = $state<string[]>([]);
  let mempoolInfo = $state<MempoolInfo | null>(null);
  let recentBlocks = $state<Block[]>([]);
  let txDetails = $state<Map<string, RawTransaction>>(new Map());
  let loading = $state(false);
  let error = $state('');

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v && !loading) load();
  });

  async function load(): Promise<void> {
    loading = true;
    error = '';
    try {
      const results = await Promise.allSettled([
        getRawMempool(false) as Promise<string[]>,
        loadRecentBlocks(),
      ]);

      if (results[0].status === 'fulfilled') {
        const pool = results[0].value as string[];
        mempoolTxids = pool;
        mempoolInfo = { size: pool.length, bytes: 0, usage: 0 };
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }

  async function loadRecentBlocks(): Promise<void> {
    const info = await getBlockchainInfo();
    const blocks: Block[] = [];
    for (let i = 0; i < 5; i++) {
      const h = info.blocks - i;
      if (h < 0) break;
      try {
        blocks.push(await getBlock(h));
      } catch {
        break;
      }
    }
    recentBlocks = blocks;

    // Fetch tx details in background for pool tags
    const allTxids = blocks.flatMap(b => b.tx);
    const results = await Promise.allSettled(
      allTxids.map(txid => getRawTransaction(txid)),
    );
    const map = new Map<string, RawTransaction>();
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        map.set(allTxids[idx], r.value);
      }
    });
    txDetails = map;
  }

  function txPoolTags(txid: string): ('transparent' | 'sapling' | 'orchard')[] {
    const tx = txDetails.get(txid);
    if (!tx) return [];
    const tags: ('transparent' | 'sapling' | 'orchard')[] = [];
    if (tx.vin.some(i => i.txid) || tx.vout.length > 0) {
      tags.push('transparent');
    }
    if (
      (tx.vShieldedSpend && tx.vShieldedSpend.length > 0) ||
      (tx.vShieldedOutput && tx.vShieldedOutput.length > 0)
    ) {
      tags.push('sapling');
    }
    if (tx.orchard?.actions && tx.orchard.actions.length > 0) {
      tags.push('orchard');
    }
    return tags;
  }
</script>

<svelte:head>
  <title>Transactions - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-4">
  <h1 class="text-2xl font-bold">Transactions</h1>

  {#if !isConnected}
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-8 text-center"
    >
      <p class="text-[var(--fg-muted)]">
        Connect to a node to view transactions
      </p>
    </div>
  {:else if loading}
    <LoadingSpinner text="Loading transactions..." />
  {:else if error}
    <ErrorMessage message={error} />
  {:else}
    <div class="flex gap-2 border-b border-[var(--bd)] pb-2">
      <button
        onclick={() => (activeTab = 'recent')}
        class="rounded-md px-3 py-1.5 text-sm font-medium
               transition-colors
               {activeTab === 'recent'
          ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
          : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}"
      >
        Recent
      </button>
      <button
        onclick={() => (activeTab = 'mempool')}
        class="rounded-md px-3 py-1.5 text-sm font-medium
               transition-colors
               {activeTab === 'mempool'
          ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
          : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}"
      >
        Mempool
        {#if mempoolInfo}
          <span class="ml-1 text-xs">
            ({mempoolInfo.size})
          </span>
        {/if}
      </button>
    </div>

    {#if activeTab === 'recent'}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)]"
      >
        {#each recentBlocks as block}
          <div class="border-b border-[var(--bd)]">
            <div
              class="bg-[var(--bg)]/50 px-4 py-2
                     text-xs text-[var(--fg-muted)]"
            >
              Block
              <a href="{base}/block/{block.height}" class="font-medium">
                #{block.height}
              </a>
              - {formatTimeAgo(block.time)} -
              {block.tx.length} txs
            </div>
            <div class="divide-y divide-[var(--bd)]/50">
              {#each block.tx as txid, i}
                <div
                  class="flex items-center gap-2
                         px-4 py-2
                         hover:bg-[var(--color-primary)]/5
                         transition-colors"
                >
                  <HashLink
                    hash={txid}
                    type="transaction"
                    prefixLen={16}
                    suffixLen={16}
                  />
                  {#if i === 0}
                    <span
                      class="shrink-0 rounded-full
                             bg-[var(--color-primary)]/15
                             px-2 py-0.5 text-[10px]
                             font-medium
                             text-[var(--color-primary)]"
                    >
                      coinbase
                    </span>
                  {/if}
                  {#each txPoolTags(txid) as tag}
                    <span
                      class="shrink-0 rounded-full
                             px-2 py-0.5 text-[10px]
                             font-medium
                             {tag === 'transparent'
                        ? 'bg-blue-500/15 text-blue-400'
                        : tag === 'sapling'
                          ? 'bg-purple-500/15 text-purple-400'
                          : 'bg-green-500/15 text-green-400'}"
                    >
                      {tag}
                    </span>
                  {/each}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)]"
      >
        {#if mempoolTxids.length === 0}
          <div class="p-8 text-center text-[var(--fg-muted)]">
            Mempool is empty
          </div>
        {:else}
          <div
            class="border-b border-[var(--bd)] px-4 py-2
                   text-xs text-[var(--fg-muted)]"
          >
            {mempoolTxids.length} pending transactions
            {#if mempoolInfo}
              ({(mempoolInfo.bytes / 1024).toFixed(1)} KB)
            {/if}
          </div>
          <div class="divide-y divide-[var(--bd)]/50">
            {#each mempoolTxids as txid}
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
          </div>
        {/if}
      </div>
    {/if}
    <RpcDebug {queries} />
  {/if}
</div>
