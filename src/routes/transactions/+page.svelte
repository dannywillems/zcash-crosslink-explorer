<script lang="ts">
  import { base } from '$app/paths';
  import HashLink from '$lib/components/common/HashLink.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import {
    getRawMempool,
    getMempoolInfo,
    getBlockchainInfo,
    getBlock,
  } from '$lib/api/index.js';
  import { connected } from '$lib/stores/endpoint.js';
  import { formatTimeAgo, formatZec } from '$lib/utils/format.js';
  import type { Block, MempoolInfo, RawTransaction } from '$lib/types/index.js';

  type Tab = 'recent' | 'mempool';

  let activeTab = $state<Tab>('recent');
  let mempoolTxids = $state<string[]>([]);
  let mempoolInfo = $state<MempoolInfo | null>(null);
  let recentBlocks = $state<Block[]>([]);
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
        getRawMempool(false) as Promise<string[]>,
        getMempoolInfo(),
        loadRecentBlocks(),
      ]);

      if (results[0].status === 'fulfilled')
        mempoolTxids = results[0].value as string[];
      if (results[1].status === 'fulfilled') mempoolInfo = results[1].value;
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
              {#each block.tx as txid}
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
  {/if}
</div>
