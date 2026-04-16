<script lang="ts">
  import RpcDebug from '$lib/components/common/RpcDebug.svelte';
  import {
    getTflRosterZec,
    getTflRosterZats,
    type RosterMember,
  } from '$lib/api/staking.js';
  import { connected } from '$lib/stores/endpoint.js';
  import { truncateHash, formatZec, formatNumber } from '$lib/utils/format.js';
  import { base } from '$app/paths';
  import type { StakingRosterEntry } from '$lib/types/index.js';

  type Tab = 'stake' | 'power';

  let activeTab = $state<Tab>('stake');
  let rosterZec = $state<StakingRosterEntry[]>([]);
  let rosterZats = $state<RosterMember[]>([]);
  let loading = $state(false);
  let error = $state('');

  let isConnected = $state(false);
  let loaded = $state(false);
  connected.subscribe(v => {
    isConnected = v;
    if (v && !loaded) {
      loaded = true;
      load();
    }
  });

  let totalStakeZec = $derived(
    rosterZec.reduce((s, e) => s + (e.voting_power ?? 0), 0),
  );
  let totalStakeZats = $derived(
    rosterZats.reduce((s, e) => s + (e.voting_power ?? 0), 0),
  );
  let totalTxCount = $derived(
    rosterZats.reduce((s, e) => s + (e.txids?.length ?? 0), 0),
  );

  let byStakeZec = $derived(
    [...rosterZec].sort(
      (a, b) => (b.voting_power ?? 0) - (a.voting_power ?? 0),
    ),
  );
  let byStakeZats = $derived(
    [...rosterZats].sort(
      (a, b) => (b.voting_power ?? 0) - (a.voting_power ?? 0),
    ),
  );

  async function load(): Promise<void> {
    loading = true;
    error = '';
    const results = await Promise.allSettled([
      getTflRosterZec(),
      getTflRosterZats(),
    ]);

    if (results[0].status === 'fulfilled') {
      rosterZec = results[0].value;
    }
    if (results[1].status === 'fulfilled') {
      rosterZats = results[1].value;
    }
    if (results.every(r => r.status === 'rejected')) {
      const reasons = results
        .map(r =>
          r.status === 'rejected'
            ? r.reason instanceof Error
              ? r.reason.message
              : String(r.reason)
            : '',
        )
        .filter(Boolean);
      error = 'Could not load staking roster: ' + reasons.join('; ');
    }
    loading = false;
  }

  function vp(entry: { voting_power?: number }): number {
    return entry.voting_power ?? 0;
  }

  const queries = [
    {
      method: 'get_tfl_roster_zec',
      params: [],
      description: 'Stakers with ZEC amounts',
    },
    {
      method: 'get_tfl_roster_zats',
      params: [],
      description: 'Stakers with zatoshi amounts and tx IDs',
    },
    {
      method: 'getbondinfo',
      params: ['(pub_key_hex)'],
      description: 'Bond info for a specific key',
    },
  ];
</script>

<svelte:head>
  <title>Validators - Zcash Crosslink Explorer</title>
</svelte:head>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">Validators</h1>
    <p class="mt-1 text-sm text-[var(--fg-muted)]">
      PoS validators ranked by stake and voting power
    </p>
  </div>

  {#if !isConnected}
    <div
      class="rounded-lg border border-[var(--bd)]
             bg-[var(--bg-raised)] p-8 text-center"
    >
      <p class="text-[var(--fg-muted)]">
        Connect to a node to view top addresses
      </p>
    </div>
  {:else}
    <!-- Summary cards -->
    <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <p
          class="text-xs font-medium uppercase
                 text-[var(--fg-muted)]"
        >
          Total Stakers
        </p>
        <p class="mt-1 text-2xl font-bold">
          {#if loading}
            ...
          {:else}
            {rosterZec.length || rosterZats.length}
          {/if}
        </p>
      </div>
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <p
          class="text-xs font-medium uppercase
                 text-[var(--fg-muted)]"
        >
          Total Staked
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums">
          {#if loading}
            ...
          {:else if totalStakeZats > 0}
            {formatZec(totalStakeZats)} ZEC
          {:else}
            {formatNumber(totalStakeZec)} ZEC
          {/if}
        </p>
      </div>
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <p
          class="text-xs font-medium uppercase
                 text-[var(--fg-muted)]"
        >
          Stake Txs
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums">
          {#if loading}...{:else}{totalTxCount}{/if}
        </p>
      </div>
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] p-4"
      >
        <p
          class="text-xs font-medium uppercase
                 text-[var(--fg-muted)]"
        >
          Top Staker Share
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums">
          {#if loading}
            ...
          {:else if byStakeZec.length > 0 && totalStakeZec > 0}
            {((vp(byStakeZec[0]) / totalStakeZec) * 100).toFixed(1)}%
          {:else if byStakeZats.length > 0 && totalStakeZats > 0}
            {((vp(byStakeZats[0]) / totalStakeZats) * 100).toFixed(1)}%
          {:else}
            N/A
          {/if}
        </p>
      </div>
    </div>

    <!-- Tab selector -->
    <div class="flex gap-2 border-b border-[var(--bd)] pb-2">
      <button
        onclick={() => (activeTab = 'stake')}
        class="rounded-md px-3 py-1.5 text-sm font-medium
               transition-colors
               {activeTab === 'stake'
          ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
          : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}"
      >
        By Stake (ZEC)
      </button>
      <button
        onclick={() => (activeTab = 'power')}
        class="rounded-md px-3 py-1.5 text-sm font-medium
               transition-colors
               {activeTab === 'power'
          ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
          : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}"
      >
        Detailed (Zatoshis + Txs)
      </button>
    </div>

    {#if error}
      <div
        class="rounded-lg border border-red-500/30
               bg-red-500/10 px-4 py-3 text-sm
               text-red-400"
      >
        {error}
      </div>
    {/if}

    {#if activeTab === 'stake'}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] overflow-x-auto"
      >
        {#if loading}
          <div
            class="px-4 py-6 text-sm
                   text-[var(--fg-muted)]"
          >
            Loading roster...
          </div>
        {:else if byStakeZec.length === 0}
          <div
            class="px-4 py-6 text-sm
                   text-[var(--fg-muted)]"
          >
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
                <th class="px-4 py-2 w-16">Rank</th>
                <th class="px-4 py-2">Public Key</th>
                <th class="px-4 py-2 text-right"> Stake (ZEC) </th>
                <th class="px-4 py-2 text-right">Share</th>
                <th class="px-4 py-2">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {#each byStakeZec as entry, i}
                {@const share =
                  totalStakeZec > 0 ? (vp(entry) / totalStakeZec) * 100 : 0}
                <tr
                  class="border-b border-[var(--bd)]/50
                         hover:bg-[var(--color-primary)]/5
                         transition-colors"
                >
                  <td class="px-4 py-2">
                    <span
                      class="inline-flex h-6 w-6
                             items-center justify-center
                             rounded-full text-xs
                             font-bold
                             {i === 0
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : i < 3
                          ? 'bg-[var(--fg-muted)]/20 text-[var(--fg-muted)]'
                          : 'text-[var(--fg-muted)]'}"
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td class="px-4 py-2 font-mono text-xs">
                    <span title={entry.public_key ?? entry.pub_key ?? ''}>
                      {truncateHash(
                        entry.public_key ?? entry.pub_key ?? '',
                        12,
                        12,
                      )}
                    </span>
                  </td>
                  <td
                    class="px-4 py-2 text-right font-mono
                           tabular-nums"
                  >
                    {vp(entry).toLocaleString()}
                  </td>
                  <td
                    class="px-4 py-2 text-right tabular-nums
                           text-[var(--fg-muted)]"
                  >
                    {share.toFixed(1)}%
                  </td>
                  <td class="px-4 py-2">
                    <div
                      class="h-2 w-full max-w-32
                             rounded-full
                             bg-[var(--bd)]"
                    >
                      <div
                        class="h-2 rounded-full
                               bg-[var(--color-primary)]"
                        style="width: {Math.min(share, 100)}%"
                      ></div>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {:else}
      <div
        class="rounded-lg border border-[var(--bd)]
               bg-[var(--bg-raised)] overflow-x-auto"
      >
        {#if loading}
          <div
            class="px-4 py-6 text-sm
                   text-[var(--fg-muted)]"
          >
            Loading roster...
          </div>
        {:else if byStakeZats.length === 0}
          <div
            class="px-4 py-6 text-sm
                   text-[var(--fg-muted)]"
          >
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
                <th class="px-4 py-2 w-16">Rank</th>
                <th class="px-4 py-2">Public Key</th>
                <th class="px-4 py-2 text-right"> Voting Power (zats) </th>
                <th class="px-4 py-2 text-right"> Stake (ZEC) </th>
                <th class="px-4 py-2 text-right"> Stake Txs </th>
                <th class="px-4 py-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {#each byStakeZats as entry, i}
                {@const share =
                  totalStakeZats > 0 ? (vp(entry) / totalStakeZats) * 100 : 0}
                <tr
                  class="border-b border-[var(--bd)]/50
                         hover:bg-[var(--color-primary)]/5
                         transition-colors"
                >
                  <td class="px-4 py-2">
                    <span
                      class="inline-flex h-6 w-6
                             items-center justify-center
                             rounded-full text-xs
                             font-bold
                             {i === 0
                        ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                        : i < 3
                          ? 'bg-[var(--fg-muted)]/20 text-[var(--fg-muted)]'
                          : 'text-[var(--fg-muted)]'}"
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td class="px-4 py-2 font-mono text-xs">
                    <span title={entry.pub_key ?? ''}>
                      {truncateHash(entry.pub_key ?? '', 12, 12)}
                    </span>
                  </td>
                  <td
                    class="px-4 py-2 text-right font-mono
                           tabular-nums"
                  >
                    {vp(entry).toLocaleString()}
                  </td>
                  <td
                    class="px-4 py-2 text-right font-mono
                           tabular-nums"
                  >
                    {formatZec(vp(entry))}
                  </td>
                  <td class="px-4 py-2 text-right tabular-nums">
                    {entry.txids?.length ?? 0}
                  </td>
                  <td
                    class="px-4 py-2 text-right tabular-nums
                           text-[var(--fg-muted)]"
                  >
                    {share.toFixed(1)}%
                  </td>
                </tr>
                {#if entry.txids && entry.txids.length > 0}
                  <tr>
                    <td colspan="6" class="px-4 pb-2">
                      <details class="text-xs">
                        <summary
                          class="cursor-pointer
                                 text-[var(--fg-muted)]
                                 hover:text-[var(--fg)]"
                        >
                          {entry.txids.length} stake transaction{entry.txids
                            .length > 1
                            ? 's'
                            : ''}
                        </summary>
                        <div
                          class="mt-1 space-y-1 pl-4
                                 border-l-2
                                 border-[var(--bd)]"
                        >
                          {#each entry.txids as stx}
                            <div
                              class="flex items-center
                                     justify-between gap-4"
                            >
                              <a
                                href="{base}/transaction/{stx.txid}"
                                class="font-mono
                                       hover:underline"
                              >
                                {truncateHash(stx.txid ?? '', 10, 10)}
                              </a>
                              <span
                                class="font-mono
                                       tabular-nums
                                       text-[var(--fg-muted)]"
                              >
                                {formatZec(stx.zats ?? 0)} ZEC
                              </span>
                            </div>
                          {/each}
                        </div>
                      </details>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    {/if}
  {/if}

  <RpcDebug {queries} />
</div>
