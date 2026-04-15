<script lang="ts">
  import NetworkStats from '$lib/components/dashboard/NetworkStats.svelte';
  import RecentBlocks from '$lib/components/dashboard/RecentBlocks.svelte';
</script>

<svelte:head>
  <title>Dashboard - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-6">
  <NetworkStats />
  <RecentBlocks />
</div>
