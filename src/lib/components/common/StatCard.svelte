<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    label,
    value,
    subtext = '',
    children,
  }: {
    label: string;
    value: string;
    subtext?: string;
    children?: Snippet;
  } = $props();
</script>

<div
  class="rounded-lg border border-[var(--bd)]
         bg-[var(--bg-raised)] p-4"
>
  <p
    class="text-xs font-medium uppercase tracking-wider
            text-[var(--fg-muted)]"
  >
    {label}
  </p>
  <p class="mt-1 text-2xl font-bold tabular-nums">{value}</p>
  {#if subtext}
    <p class="mt-0.5 text-xs text-[var(--fg-muted)]">
      {subtext}
    </p>
  {/if}
  {#if children}
    <div class="mt-2">
      {@render children()}
    </div>
  {/if}
</div>
