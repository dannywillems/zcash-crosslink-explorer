<script lang="ts">
  import { base } from '$app/paths';
  import { truncateHash } from '$lib/utils/format.js';

  let {
    hash,
    type = 'block',
    prefixLen = 8,
    suffixLen = 8,
  }: {
    hash: string;
    type?: 'block' | 'transaction';
    prefixLen?: number;
    suffixLen?: number;
  } = $props();

  let copied = $state(false);

  function getHref(): string {
    if (type === 'transaction') {
      return `${base}/transaction/${hash}`;
    }
    return `${base}/block/${hash}`;
  }

  async function copyHash(): Promise<void> {
    await navigator.clipboard.writeText(hash);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<span class="inline-flex items-center gap-1 font-mono text-sm">
  <a href={getHref()} class="hover:underline" title={hash}>
    {truncateHash(hash, prefixLen, suffixLen)}
  </a>
  <button
    onclick={copyHash}
    class="rounded p-0.5 text-[var(--fg-muted)]
           hover:text-[var(--fg)] transition-colors"
    title="Copy hash"
  >
    {#if copied}
      <svg
        class="h-3.5 w-3.5 text-[var(--color-success)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    {:else}
      <svg
        class="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0
             012-2h8a2 2 0 012 2v2m-6
             12h8a2 2 0 002-2v-8a2 2 0
             00-2-2h-8a2 2 0 00-2 2v8a2
             2 0 002 2z"
        />
      </svg>
    {/if}
  </button>
</span>
