<script lang="ts">
  import { rpcActivity, clearRpcActivity } from '$lib/stores/rpcActivity.js';
  import type { RpcActivityEntry } from '$lib/stores/rpcActivity.js';

  let entries = $state<RpcActivityEntry[]>([]);
  rpcActivity.subscribe(v => {
    entries = v;
  });

  let pendingCount = $derived(
    entries.filter(e => e.status === 'pending').length,
  );
  let open = $state(true);
</script>

<div
  class="rounded-lg border border-[var(--bd)]
         bg-[var(--bg-raised)] p-4"
>
  <div class="flex items-center justify-between">
    <button
      onclick={() => (open = !open)}
      class="flex items-center gap-2 text-sm
             font-semibold hover:text-[var(--fg)]
             transition-colors"
    >
      <svg
        class="h-4 w-4 transition-transform
               {open ? 'rotate-90' : ''}"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5l7 7-7 7"
        />
      </svg>
      RPC Activity
      {#if pendingCount > 0}
        <span
          class="rounded-full bg-yellow-500/20
                 px-2 py-0.5 text-xs text-yellow-400"
        >
          {pendingCount} in flight
        </span>
      {/if}
    </button>
    {#if entries.length > 0}
      <button
        onclick={() => clearRpcActivity()}
        class="text-xs text-[var(--fg-muted)]
               hover:text-[var(--fg)] transition-colors"
      >
        Clear
      </button>
    {/if}
  </div>

  {#if open}
    <div class="mt-3 max-h-64 overflow-y-auto">
      {#if entries.length === 0}
        <p class="text-xs text-[var(--fg-muted)]">No RPC calls yet</p>
      {:else}
        <div class="space-y-0.5">
          {#each entries.slice(0, 50) as entry}
            <div
              class="flex items-center gap-2
                     rounded px-2 py-1 text-xs
                     font-mono {entry.status === 'pending'
                ? 'bg-yellow-500/5'
                : ''}"
            >
              <!-- Status indicator -->
              {#if entry.status === 'pending'}
                <span
                  class="inline-block h-2 w-2
                         rounded-full bg-yellow-400
                         animate-pulse"
                ></span>
              {:else if entry.status === 'ok'}
                <span
                  class="inline-block h-2 w-2
                         rounded-full bg-green-400"
                ></span>
              {:else}
                <span
                  class="inline-block h-2 w-2
                         rounded-full bg-red-400"
                ></span>
              {/if}

              <!-- Method name -->
              <span
                class="text-[var(--color-primary)]
                       min-w-0 truncate"
              >
                {entry.method}
              </span>

              <!-- Duration or spinner -->
              <span
                class="ml-auto shrink-0
                       text-[var(--fg-muted)]"
              >
                {#if entry.status === 'pending'}
                  ...
                {:else if entry.duration !== undefined}
                  {entry.duration}ms
                {/if}
              </span>

              <!-- Error message -->
              {#if entry.error}
                <span
                  class="shrink-0 truncate
                         text-red-400"
                  title={entry.error}
                >
                  {entry.error.length > 30
                    ? entry.error.slice(0, 30) + '...'
                    : entry.error}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
