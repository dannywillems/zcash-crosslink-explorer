<script lang="ts">
  import { page } from '$app/state';
  import BlockDetail from '$lib/components/blocks/BlockDetail.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import { getBlock } from '$lib/api/index.js';
  import { connected } from '$lib/stores/endpoint.js';
  import { isBlockHeight } from '$lib/utils/format.js';
  import type { Block } from '$lib/types/index.js';

  let block = $state<Block | null>(null);
  let loading = $state(false);
  let error = $state('');

  let isConnected = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v) load();
  });

  let identifier = $derived(page.params.identifier);

  $effect(() => {
    if (isConnected && identifier) load();
  });

  async function load(): Promise<void> {
    loading = true;
    error = '';
    try {
      const id = identifier ?? '';
      if (!id) return;
      if (isBlockHeight(id)) {
        block = await getBlock(parseInt(id, 10));
      } else {
        block = await getBlock(id);
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>
    Block {identifier} - Zcash Crosslink Explorer
  </title>
</svelte:head>

{#if !isConnected}
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-8 text-center"
  >
    <p class="text-[var(--fg-muted)]">
      Connect to a node to view block details
    </p>
  </div>
{:else if loading}
  <LoadingSpinner text="Loading block..." />
{:else if error}
  <ErrorMessage message={error} />
{:else if block}
  <BlockDetail {block} />
{/if}
