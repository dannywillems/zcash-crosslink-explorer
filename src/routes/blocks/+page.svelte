<script lang="ts">
  import BlockList from '$lib/components/blocks/BlockList.svelte';
  import Pagination from '$lib/components/common/Pagination.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';
  import { getBlockchainInfo, getBlockRange } from '$lib/api/index.js';
  import { connected } from '$lib/stores/endpoint.js';
  import type { Block } from '$lib/types/index.js';

  const queries = [
    {
      method: 'getblockchaininfo',
      params: [],
      description: 'Chain height for pagination',
    },
    {
      method: 'getblockhash',
      params: [0],
      description: 'Get hash for block at height',
    },
    {
      method: 'getblock',
      params: ['(hash)', 1],
      description: 'Full block data (verbosity=1)',
    },
  ];

  const PAGE_SIZE = 25;

  let blocks = $state<Block[]>([]);
  let currentPage = $state(1);
  let totalHeight = $state(0);
  let loading = $state(false);
  let error = $state('');

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v) loadPage(1);
  });

  let totalPages = $derived(
    Math.max(1, Math.ceil((totalHeight + 1) / PAGE_SIZE)),
  );

  async function loadPage(page: number): Promise<void> {
    loading = true;
    error = '';
    try {
      const info = await getBlockchainInfo();
      totalHeight = info.blocks;
      const startHeight = info.blocks - (page - 1) * PAGE_SIZE;
      blocks = await getBlockRange(startHeight, PAGE_SIZE);
      currentPage = page;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Blocks - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">Blocks</h1>
    {#if totalHeight > 0}
      <span class="text-sm text-[var(--fg-muted)]">
        {totalHeight.toLocaleString()} total blocks
      </span>
    {/if}
  </div>

  {#if !isConnected}
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-8 text-center"
    >
      <p class="text-[var(--fg-muted)]">Connect to a node to view blocks</p>
    </div>
  {:else if loading}
    <LoadingSpinner text="Loading blocks..." />
  {:else if error}
    <ErrorMessage message={error} />
  {:else}
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)]"
    >
      <BlockList {blocks} />
    </div>
    <Pagination {currentPage} {totalPages} onPageChange={loadPage} />
  {/if}
  <RpcDebug {queries} />
</div>
