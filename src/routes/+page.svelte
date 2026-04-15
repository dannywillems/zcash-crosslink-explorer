<script lang="ts">
  import NetworkStats from '$lib/components/dashboard/NetworkStats.svelte';
  import RecentBlocks from '$lib/components/dashboard/RecentBlocks.svelte';
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';

  const queries = [
    {
      method: 'getblockchaininfo',
      params: [],
      description: 'Chain name, height, difficulty',
    },
    {
      method: 'getmininginfo',
      params: [],
      description: 'Mining stats, hash rate',
    },
    {
      method: 'get_tfl_final_block_height_and_hash',
      params: [],
      description: 'Finalized PoW block',
    },
    {
      method: 'getpeerinfo',
      params: [],
      description: 'Connected peers',
    },
    {
      method: 'getbestblockhash',
      params: [],
      description: 'Best block hash',
    },
  ];
</script>

<svelte:head>
  <title>Dashboard - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-6">
  <NetworkStats />
  <RecentBlocks />
  <RpcDebug {queries} />
</div>
