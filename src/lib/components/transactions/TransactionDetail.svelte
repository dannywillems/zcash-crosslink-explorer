<script lang="ts">
  import { base } from '$app/paths';
  import HashLink from '$lib/components/common/HashLink.svelte';
  import {
    formatZec,
    formatDateTime,
    formatTimeAgo,
    formatBytes,
  } from '$lib/utils/format.js';
  import type { RawTransaction } from '$lib/types/index.js';

  let { tx }: { tx: RawTransaction } = $props();
</script>

<div class="space-y-6">
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-6"
  >
    <div class="flex items-center gap-3">
      <h2 class="text-xl font-bold">Transaction</h2>
      {#if tx.confirmations !== undefined}
        <span
          class="rounded-full px-2 py-0.5 text-xs font-medium
                 {tx.confirmations > 0
            ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
            : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'}"
        >
          {tx.confirmations > 0
            ? `${tx.confirmations} confirmations`
            : 'Pending'}
        </span>
      {/if}
    </div>

    <div class="mt-4 space-y-3">
      <div>
        <p class="text-xs uppercase text-[var(--fg-muted)]">Transaction ID</p>
        <p class="font-mono text-sm break-all">{tx.txid}</p>
      </div>
      {#if tx.blockhash}
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Block</p>
          <HashLink hash={tx.blockhash} prefixLen={12} suffixLen={12} />
        </div>
      {/if}
      {#if tx.time}
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Time</p>
          <p class="text-sm">
            {formatDateTime(tx.time)}
            <span class="text-[var(--fg-muted)]">
              ({formatTimeAgo(tx.time)})
            </span>
          </p>
        </div>
      {/if}
      {#if tx.size}
        <div>
          <p class="text-xs uppercase text-[var(--fg-muted)]">Size</p>
          <p class="text-sm">{formatBytes(tx.size)}</p>
        </div>
      {/if}
      <div>
        <p class="text-xs uppercase text-[var(--fg-muted)]">Version</p>
        <p class="text-sm">{tx.version}</p>
      </div>
      <div>
        <p class="text-xs uppercase text-[var(--fg-muted)]">Locktime</p>
        <p class="text-sm">{tx.locktime}</p>
      </div>
    </div>
  </div>

  <!-- Inputs -->
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)]"
  >
    <div class="border-b border-[var(--bd)] px-4 py-3">
      <h3 class="font-semibold">
        Inputs ({tx.vin.length})
      </h3>
    </div>
    <div class="divide-y divide-[var(--bd)]/50">
      {#each tx.vin as input, i}
        <div class="px-4 py-3">
          {#if input.coinbase}
            <span
              class="rounded-full bg-[var(--color-primary)]/15
                     px-2 py-0.5 text-xs font-medium
                     text-[var(--color-primary)]"
            >
              Coinbase
            </span>
            <p
              class="mt-1 font-mono text-xs break-all
                      text-[var(--fg-muted)]"
            >
              {input.coinbase}
            </p>
          {:else if input.txid}
            <div class="flex items-center gap-2">
              <span
                class="text-xs text-[var(--fg-muted)]
                       tabular-nums w-6"
              >
                {i}
              </span>
              <a
                href="{base}/transaction/{input.txid}"
                class="font-mono text-sm hover:underline"
              >
                {input.txid}:{input.vout}
              </a>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>

  <!-- Outputs -->
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)]"
  >
    <div class="border-b border-[var(--bd)] px-4 py-3">
      <h3 class="font-semibold">
        Outputs ({tx.vout.length})
      </h3>
    </div>
    <div class="divide-y divide-[var(--bd)]/50">
      {#each tx.vout as output}
        <div class="flex items-center justify-between px-4 py-3">
          <div class="flex items-center gap-2">
            <span
              class="text-xs text-[var(--fg-muted)]
                     tabular-nums w-6"
            >
              {output.n}
            </span>
            <div>
              {#if output.scriptPubKey.addresses}
                {#each output.scriptPubKey.addresses as addr}
                  <p class="font-mono text-sm">{addr}</p>
                {/each}
              {:else}
                <span class="text-xs text-[var(--fg-muted)]">
                  {output.scriptPubKey.type}
                </span>
              {/if}
            </div>
          </div>
          <span class="font-mono text-sm font-medium tabular-nums">
            {formatZec(Math.round(output.value * 100_000_000))} ZEC
          </span>
        </div>
      {/each}
    </div>
  </div>
</div>
