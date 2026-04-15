<script lang="ts">
  import ChainView from '$lib/components/chain/ChainView.svelte';
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';

  const queries = [
    {
      method: 'getblockchaininfo',
      params: [],
      description: 'PoW chain tip height',
    },
    {
      method: 'get_tfl_final_block_height_and_hash',
      params: [],
      description: 'Finalized PoW block',
    },
    {
      method: 'get_tfl_fat_pointer_to_bft_chain_tip',
      params: [],
      description: 'BFT chain tip pointer',
    },
    {
      method: 'get_tfl_block_finality_from_hash',
      params: ['(block_hash)'],
      description: 'Per-block finality status',
    },
    {
      method: 'getblock',
      params: ['(hash)', 1],
      description: 'PoW block data',
    },
  ];
</script>

<svelte:head>
  <title>Chain View - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-4">
  <div>
    <h1 class="text-2xl font-bold">Chain View</h1>
    <p class="mt-1 text-sm text-[var(--fg-muted)]">
      Dual-chain visualization showing PoW and PoS/BFT blocks with cross-chain
      references
    </p>
  </div>
  <ChainView />
  <RpcDebug {queries} />
</div>
