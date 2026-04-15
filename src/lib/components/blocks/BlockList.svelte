<script lang="ts">
  import { base } from '$app/paths';
  import HashLink from '$lib/components/common/HashLink.svelte';
  import { formatTimeAgo, formatBytes } from '$lib/utils/format.js';
  import type { Block } from '$lib/types/index.js';

  let { blocks }: { blocks: Block[] } = $props();
</script>

<div class="overflow-x-auto">
  <table class="w-full text-sm">
    <thead>
      <tr
        class="border-b border-[var(--bd)] text-left
               text-xs uppercase text-[var(--fg-muted)]"
      >
        <th class="px-4 py-2">Height</th>
        <th class="px-4 py-2">Hash</th>
        <th class="px-4 py-2">Txs</th>
        <th class="px-4 py-2">Size</th>
        <th class="px-4 py-2">Difficulty</th>
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
            <a href="{base}/block/{block.height}" class="font-mono font-medium">
              {block.height}
            </a>
          </td>
          <td class="px-4 py-2">
            <HashLink hash={block.hash} />
          </td>
          <td class="px-4 py-2 tabular-nums">
            {block.tx.length}
          </td>
          <td class="px-4 py-2 text-[var(--fg-muted)]">
            {formatBytes(block.size)}
          </td>
          <td class="px-4 py-2 tabular-nums text-[var(--fg-muted)]">
            {block.difficulty.toFixed(2)}
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
