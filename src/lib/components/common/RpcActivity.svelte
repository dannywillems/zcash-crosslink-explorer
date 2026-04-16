<script lang="ts">
  import { rpcActivity, clearRpcActivity } from '$lib/stores/rpcActivity.js';
  import type { RpcActivityEntry } from '$lib/stores/rpcActivity.js';
  import { getEndpoint } from '$lib/api/rpc.js';

  let entries = $state<RpcActivityEntry[]>([]);
  rpcActivity.subscribe(v => {
    entries = v;
  });

  let pendingCount = $derived(
    entries.filter(e => e.status === 'pending').length,
  );
  let open = $state(true);
  let expandedId = $state<number | null>(null);

  function toggle(id: number): void {
    expandedId = expandedId === id ? null : id;
  }

  function requestBody(entry: RpcActivityEntry): string {
    return JSON.stringify(
      {
        jsonrpc: '2.0',
        id: entry.id,
        method: entry.method,
        params: entry.params,
      },
      null,
      2,
    );
  }

  function responseBody(entry: RpcActivityEntry): string {
    if (!entry.response) return 'No response';
    return JSON.stringify(entry.response, null, 2);
  }

  function curlCommand(entry: RpcActivityEntry): string {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: entry.method,
      params: entry.params,
    });
    const escaped = body.replace(/"/g, '\\"');
    const endpoint = getEndpoint() || 'http://127.0.0.1:8232';
    return (
      'curl -s -X POST ' +
      '-H "Content-Type: application/json" ' +
      `-d "${escaped}" ` +
      endpoint
    );
  }

  let copiedId = $state<number | null>(null);

  async function copyJson(text: string, id: number): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      copiedId = id;
      setTimeout(() => {
        copiedId = null;
      }, 1500);
    } catch {
      // clipboard blocked
    }
  }
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
      RPC Activity ({entries.length})
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
        onclick={() => {
          clearRpcActivity();
          expandedId = null;
        }}
        class="text-xs text-[var(--fg-muted)]
               hover:text-[var(--fg)] transition-colors"
      >
        Clear
      </button>
    {/if}
  </div>

  {#if open}
    <div class="mt-3 max-h-[32rem] overflow-y-auto">
      {#if entries.length === 0}
        <p class="text-xs text-[var(--fg-muted)]">No RPC calls yet</p>
      {:else}
        <div class="space-y-0.5">
          {#each entries.slice(0, 50) as entry (entry.id)}
            <!-- Row -->
            <button
              onclick={() => toggle(entry.id)}
              class="flex w-full items-center gap-2
                     rounded px-2 py-1 text-xs
                     font-mono text-left
                     hover:bg-[var(--color-primary)]/5
                     transition-colors
                     {entry.status === 'pending' ? 'bg-yellow-500/5' : ''}
                     {expandedId === entry.id
                ? 'bg-[var(--color-primary)]/10'
                : ''}"
            >
              {#if entry.status === 'pending'}
                <span
                  class="inline-block h-2 w-2
                         shrink-0 rounded-full
                         bg-yellow-400 animate-pulse"
                ></span>
              {:else if entry.status === 'ok'}
                <span
                  class="inline-block h-2 w-2
                         shrink-0 rounded-full
                         bg-green-400"
                ></span>
              {:else}
                <span
                  class="inline-block h-2 w-2
                         shrink-0 rounded-full
                         bg-red-400"
                ></span>
              {/if}

              <span
                class="text-[var(--color-primary)]
                       min-w-0 truncate"
              >
                {entry.method}
              </span>

              {#if entry.params.length > 0}
                <span
                  class="min-w-0 truncate
                         text-[var(--fg-muted)]"
                >
                  ({JSON.stringify(entry.params)})
                </span>
              {/if}

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

              {#if entry.error}
                <span
                  class="shrink-0 truncate text-red-400"
                  title={entry.error}
                >
                  {entry.error.length > 30
                    ? entry.error.slice(0, 30) + '...'
                    : entry.error}
                </span>
              {/if}
            </button>

            <!-- Expanded detail -->
            {#if expandedId === entry.id}
              <div
                class="mx-2 mb-2 rounded border
                       border-[var(--bd)] bg-[var(--bg)]
                       p-3 text-xs"
              >
                <!-- Request -->
                <div
                  class="mb-2 flex items-center
                         justify-between"
                >
                  <span
                    class="font-semibold
                           text-[var(--fg-muted)]"
                  >
                    Request
                  </span>
                  <div class="flex gap-1">
                    <button
                      onclick={() =>
                        copyJson(curlCommand(entry), entry.id * 1000)}
                      class="rounded border
                             border-[var(--bd)] px-2
                             py-0.5 text-[var(--fg-muted)]
                             hover:text-[var(--fg)]
                             transition-colors
                             {copiedId === entry.id * 1000
                        ? 'text-green-400 border-green-400'
                        : ''}"
                    >
                      {copiedId === entry.id * 1000 ? 'Copied!' : 'curl'}
                    </button>
                    <button
                      onclick={() =>
                        copyJson(requestBody(entry), entry.id * 1000 + 1)}
                      class="rounded border
                             border-[var(--bd)] px-2
                             py-0.5 text-[var(--fg-muted)]
                             hover:text-[var(--fg)]
                             transition-colors
                             {copiedId === entry.id * 1000 + 1
                        ? 'text-green-400 border-green-400'
                        : ''}"
                    >
                      {copiedId === entry.id * 1000 + 1 ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <pre
                  class="overflow-auto rounded
                         bg-[var(--bg-raised)] p-2
                         font-mono text-[10px]
                         leading-relaxed
                         text-[var(--fg-muted)]
                         max-h-40">{requestBody(entry)}</pre>

                <!-- Response -->
                <div
                  class="mt-3 mb-2 flex items-center
                         justify-between"
                >
                  <span
                    class="font-semibold
                           text-[var(--fg-muted)]"
                  >
                    Response
                    {#if entry.duration !== undefined}
                      <span class="font-normal">
                        ({entry.duration}ms)
                      </span>
                    {/if}
                  </span>
                  {#if entry.response}
                    <button
                      onclick={() =>
                        copyJson(responseBody(entry), entry.id * 1000 + 2)}
                      class="rounded border
                             border-[var(--bd)] px-2
                             py-0.5 text-[var(--fg-muted)]
                             hover:text-[var(--fg)]
                             transition-colors
                             {copiedId === entry.id * 1000 + 2
                        ? 'text-green-400 border-green-400'
                        : ''}"
                    >
                      {copiedId === entry.id * 1000 + 2 ? 'Copied!' : 'Copy'}
                    </button>
                  {/if}
                </div>
                <pre
                  class="overflow-auto rounded
                         bg-[var(--bg-raised)] p-2
                         font-mono text-[10px]
                         leading-relaxed
                         max-h-80
                         {entry.error
                    ? 'text-red-400'
                    : 'text-[var(--fg-muted)]'}">{responseBody(entry)}</pre>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
