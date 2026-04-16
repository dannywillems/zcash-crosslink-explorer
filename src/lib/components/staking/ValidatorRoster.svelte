<script lang="ts">
  import { getTflRosterZec } from '$lib/api/index.js';
  import { connected } from '$lib/stores/endpoint.js';
  import type { StakingRosterEntry } from '$lib/types/index.js';
  import { truncateHash, formatZec } from '$lib/utils/format.js';

  let roster = $state<StakingRosterEntry[]>([]);
  let loading = $state(false);
  let error = $state('');
  let totalPower = $state(0);

  let isConnected = $state(false);
  let loaded = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v && !loaded) {
      loaded = true;
      load();
    }
  });

  async function load(): Promise<void> {
    loading = true;
    error = '';
    try {
      roster = await getTflRosterZec();
      totalPower = roster.reduce((sum, e) => sum + (e.voting_power ?? 0), 0);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load';
    } finally {
      loading = false;
    }
  }
</script>

{#if !isConnected}
  <div
    class="rounded-lg border border-[var(--bd)]
           bg-[var(--bg-raised)] p-8 text-center"
  >
    <p class="text-[var(--fg-muted)]">
      Connect to a node to view staking roster
    </p>
  </div>
{:else}
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">
        Validator Roster
        {#if !loading}({roster.length}){/if}
      </h2>
      <button
        onclick={load}
        disabled={loading}
        class="rounded-md border border-[var(--bd)]
               px-3 py-1 text-xs text-[var(--fg-muted)]
               hover:text-[var(--fg)] transition-colors
               disabled:opacity-50"
      >
        Refresh
      </button>
    </div>

    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] overflow-x-auto"
    >
      {#if loading}
        <div class="px-4 py-6 text-sm text-[var(--fg-muted)]">
          Loading roster...
        </div>
      {:else if error}
        <div class="px-4 py-6 text-sm text-red-400">
          {error}
        </div>
      {:else if roster.length === 0}
        <div class="px-4 py-6 text-sm text-[var(--fg-muted)]">
          No validators in roster
        </div>
      {:else}
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-[var(--bd)]
                     text-left text-xs uppercase
                     text-[var(--fg-muted)]"
            >
              <th class="px-4 py-2">Rank</th>
              <th class="px-4 py-2">Public Key</th>
              <th class="px-4 py-2">Voting Power</th>
              <th class="px-4 py-2">Share</th>
              <th class="px-4 py-2">Stake (ZEC)</th>
            </tr>
          </thead>
          <tbody>
            {#each [...roster].sort((a, b) => (b.voting_power ?? 0) - (a.voting_power ?? 0)) as entry, i}
              {@const share =
                totalPower > 0
                  ? ((entry.voting_power ?? 0) / totalPower) * 100
                  : 0}
              <tr
                class="border-b border-[var(--bd)]/50
                       hover:bg-[var(--color-primary)]/5
                       transition-colors"
              >
                <td class="px-4 py-2">
                  <span
                    class="inline-flex h-6 w-6
                           items-center justify-center
                           rounded-full text-xs font-bold
                           {i === 0
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                      : i < 3
                        ? 'bg-[var(--fg-muted)]/20 text-[var(--fg-muted)]'
                        : 'text-[var(--fg-muted)]'}"
                  >
                    {i + 1}
                  </span>
                </td>
                <td class="px-4 py-2 font-mono text-sm">
                  <span title={entry.public_key ?? entry.pub_key ?? ''}>
                    {truncateHash(
                      entry.public_key ?? entry.pub_key ?? '',
                      10,
                      10,
                    )}
                  </span>
                </td>
                <td class="px-4 py-2 tabular-nums">
                  {(entry.voting_power ?? 0).toLocaleString()}
                </td>
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <div
                      class="h-2 w-24 rounded-full
                             bg-[var(--bd)]"
                    >
                      <div
                        class="h-2 rounded-full
                               bg-[var(--color-primary)]"
                        style="width: {Math.min(share, 100)}%"
                      ></div>
                    </div>
                    <span
                      class="text-xs tabular-nums
                             text-[var(--fg-muted)]"
                    >
                      {share.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td class="px-4 py-2 font-mono tabular-nums">
                  {formatZec(entry.voting_power ?? 0)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </div>
  </div>
{/if}
