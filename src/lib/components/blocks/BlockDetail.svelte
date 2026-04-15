<script lang="ts">
  import { base } from '$app/paths';
  import HashLink from '$lib/components/common/HashLink.svelte';
  import {
    formatDateTime,
    formatTimeAgo,
    formatBytes,
    formatNumber,
  } from '$lib/utils/format.js';
  import type { Block } from '$lib/types/index.js';

  let { block }: { block: Block } = $props();
</script>

<div class="space-y-6">
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-6"
  >
    <div class="flex items-center gap-3">
      <h2 class="text-xl font-bold">
        Block #{formatNumber(block.height)}
      </h2>
      <span
        class="rounded-full px-2 py-0.5 text-xs font-medium
               {block.confirmations > 0
          ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
          : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'}"
      >
        {block.confirmations > 0
          ? `${block.confirmations} confirmations`
          : 'Unconfirmed'}
      </span>
    </div>

    <div class="mt-4 grid gap-4 md:grid-cols-2">
      <div class="space-y-3">
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Hash</p>
          <p class="font-mono text-sm break-all">{block.hash}</p>
        </div>
        {#if block.previousblockhash}
          <div>
            <p class="text-xs uppercase text-[var(--fg-muted)]">
              Previous Block
            </p>
            <HashLink
              hash={block.previousblockhash}
              prefixLen={12}
              suffixLen={12}
            />
          </div>
        {/if}
        {#if block.nextblockhash}
          <div>
            <p class="text-xs uppercase text-[var(--fg-muted)]">Next Block</p>
            <HashLink
              hash={block.nextblockhash}
              prefixLen={12}
              suffixLen={12}
            />
          </div>
        {/if}
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Merkle Root</p>
          <p class="font-mono text-sm break-all">
            {block.merkleroot}
          </p>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Timestamp</p>
          <p class="text-sm">
            {formatDateTime(block.time)}
            <span class="text-[var(--fg-muted)]">
              ({formatTimeAgo(block.time)})
            </span>
          </p>
        </div>
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Transactions</p>
          <p class="text-sm">{block.tx.length}</p>
        </div>
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Size</p>
          <p class="text-sm">{formatBytes(block.size)}</p>
        </div>
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Difficulty</p>
          <p class="text-sm tabular-nums">
            {block.difficulty}
          </p>
        </div>
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Nonce</p>
          <p class="font-mono text-sm">{block.nonce}</p>
        </div>
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Bits</p>
          <p class="font-mono text-sm">{block.bits}</p>
        </div>
      </div>
    </div>
  </div>

  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)]"
  >
    <div class="border-b border-[var(--bd)] px-4 py-3">
      <h3 class="font-semibold">
        Transactions ({block.tx.length})
      </h3>
    </div>
    <div class="divide-y divide-[var(--bd)]/50">
      {#each block.tx as txid, i}
        <div
          class="flex items-center gap-3 px-4 py-2
                 hover:bg-[var(--color-primary)]/5
                 transition-colors"
        >
          <span
            class="text-xs text-[var(--fg-muted)] tabular-nums
                   w-8"
          >
            {i}
          </span>
          <a
            href="{base}/transaction/{txid}"
            class="font-mono text-sm hover:underline break-all"
          >
            {txid}
          </a>
        </div>
      {/each}
    </div>
  </div>
</div>
