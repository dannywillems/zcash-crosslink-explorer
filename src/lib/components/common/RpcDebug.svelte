<script lang="ts">
  import { rpcCallRaw } from '$lib/api/rpc.js';

  interface Query {
    method: string;
    params: unknown[];
    description: string;
  }

  let {
    queries,
    results = $bindable({}),
  }: {
    queries: Query[];
    results?: Record<string, unknown>;
  } = $props();

  let open = $state(false);
  let loading = $state(false);
  let selectedQuery = $state<string | null>(null);
  let rawOutput = $state<string>('');

  async function fetchAll(): Promise<void> {
    loading = true;
    const out: Record<string, unknown> = {};
    for (const q of queries) {
      try {
        out[q.method] = await rpcCallRaw(q.method, q.params);
      } catch (e) {
        out[q.method] = {
          error: e instanceof Error ? e.message : 'Failed',
        };
      }
    }
    results = out;
    loading = false;
  }

  async function fetchOne(q: Query): Promise<void> {
    selectedQuery = q.method;
    try {
      const data = await rpcCallRaw(q.method, q.params);
      rawOutput = JSON.stringify(data, null, 2);
    } catch (e) {
      rawOutput = JSON.stringify(
        {
          error: e instanceof Error ? e.message : 'Failed',
        },
        null,
        2,
      );
    }
  }

  function curlCommand(q: Query): string {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: q.method,
      params: q.params,
    });
    return `curl -s -X POST -H "Content-Type: application/json" -d '${body}' http://127.0.0.1:8232`;
  }
</script>

<div class="mt-6">
  <button
    onclick={() => (open = !open)}
    class="flex items-center gap-2 text-xs
           text-[var(--fg-muted)] hover:text-[var(--fg)]
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
    RPC Queries ({queries.length})
  </button>

  {#if open}
    <div
      class="mt-2 rounded-lg border border-[var(--bd)]
             bg-[var(--bg)] text-xs"
    >
      <!-- Query list -->
      <div class="divide-y divide-[var(--bd)]/50">
        {#each queries as q}
          <div class="px-4 py-2">
            <div class="flex items-center justify-between">
              <div>
                <code class="font-mono text-[var(--color-primary)]">
                  {q.method}
                </code>
                {#if q.params.length > 0}
                  <code class="ml-1 text-[var(--fg-muted)]">
                    ({JSON.stringify(q.params)})
                  </code>
                {/if}
                <span class="ml-2 text-[var(--fg-muted)]">
                  - {q.description}
                </span>
              </div>
              <div class="flex gap-2 shrink-0">
                <button
                  onclick={() => fetchOne(q)}
                  class="rounded border border-[var(--bd)]
                         px-2 py-0.5
                         text-[var(--fg-muted)]
                         hover:text-[var(--fg)]
                         transition-colors"
                >
                  Run
                </button>
                <button
                  onclick={() => navigator.clipboard.writeText(curlCommand(q))}
                  class="rounded border border-[var(--bd)]
                         px-2 py-0.5
                         text-[var(--fg-muted)]
                         hover:text-[var(--fg)]
                         transition-colors"
                  title="Copy curl command"
                >
                  curl
                </button>
              </div>
            </div>

            <!-- Raw output for this query -->
            {#if selectedQuery === q.method && rawOutput}
              <div class="mt-2">
                <div
                  class="flex items-center justify-between
                         mb-1"
                >
                  <span class="text-[var(--fg-muted)]"> Raw response: </span>
                  <button
                    onclick={() => {
                      selectedQuery = null;
                      rawOutput = '';
                    }}
                    class="text-[var(--fg-muted)]
                           hover:text-[var(--fg)]"
                  >
                    Close
                  </button>
                </div>
                <pre
                  class="max-h-80 overflow-auto rounded
                         bg-[var(--bg-raised)] p-3
                         font-mono text-[10px]
                         leading-relaxed
                         text-[var(--fg-muted)]">{rawOutput}</pre>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Fetch all button -->
      <div
        class="border-t border-[var(--bd)]/50 px-4 py-2
               flex gap-2"
      >
        <button
          onclick={fetchAll}
          disabled={loading}
          class="rounded border border-[var(--color-primary)]
                 px-3 py-1
                 text-[var(--color-primary)]
                 hover:bg-[var(--color-primary)]/10
                 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Fetching...' : 'Run All'}
        </button>
      </div>
    </div>
  {/if}
</div>
