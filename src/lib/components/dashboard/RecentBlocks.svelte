<script lang="ts">
  import { base } from '$app/paths';
  import HashLink from '$lib/components/common/HashLink.svelte';
  import LoadingSpinner from '$lib/components/common/LoadingSpinner.svelte';
  import ErrorMessage from '$lib/components/common/ErrorMessage.svelte';
  import { getBlockchainInfo, getBlockRange } from '$lib/api/index.js';
  import { formatTimeAgo } from '$lib/utils/format.js';
  import { connected } from '$lib/stores/endpoint.js';
  import type { Block } from '$lib/types/index.js';

  let blocks = $state<Block[]>([]);
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
      const info = await getBlockchainInfo();
      blocks = await getBlockRange(info.blocks, 10);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }
</script>

{#if !isConnected}
  <!-- shown by NetworkStats -->
{:else if loading}
  <LoadingSpinner text="Loading recent blocks..." />
{:else if error}
  <ErrorMessage message={error} />
{:else}
  <div
    class="rounded-lg border border-[var(--bd)]
              bg-[var(--bg-raised)]"
  >
    <div
      class="flex items-center justify-between border-b
                border-[var(--bd)] px-4 py-3"
    >
      <h2 class="text-lg font-semibold">Recent Blocks</h2>
      <div class="flex gap-2">
        <button
          onclick={load}
          class="rounded-md px-3 py-1 text-xs
                 text-[var(--fg-muted)]
                 hover:text-[var(--fg)]
                 border border-[var(--bd)]
                 transition-colors"
        >
          Refresh
        </button>
        <a
          href="{base}/blocks"
          class="rounded-md px-3 py-1 text-xs
                 text-[var(--color-primary)]
                 border border-[var(--color-primary)]/30
                 hover:bg-[var(--color-primary)]/10
                 no-underline transition-colors"
        >
          View All
        </a>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr
            class="border-b border-[var(--bd)]
                     text-left text-xs uppercase
                     text-[var(--fg-muted)]"
          >
            <th class="px-4 py-2">Height</th>
            <th class="px-4 py-2">Hash</th>
            <th class="px-4 py-2">Txs</th>
            <th class="px-4 py-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {#each blocks as block}
            <tr
              class="border-b border-[var(--bd)]/50
                     hover:bg-[var(--color-primary)]/5
                     transition-colors"
            >
              <td class="px-4 py-2">
                <a
                  href="{base}/block/{block.height}"
                  class="font-mono font-medium"
                >
                  {block.height}
                </a>
              </td>
              <td class="px-4 py-2">
                <HashLink hash={block.hash} />
              </td>
              <td class="px-4 py-2 tabular-nums">
                {block.tx.length}
              </td>
              <td
                class="px-4 py-2 text-[var(--fg-muted)]"
                title={new Date(block.time * 1000).toLocaleString()}
              >
                {formatTimeAgo(block.time)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
{/if}
