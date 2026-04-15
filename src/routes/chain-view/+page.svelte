<script lang="ts">
  import ChainView from '$lib/components/chain/ChainView.svelte';
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
</div>
