<script lang="ts">
  let {
    currentPage,
    totalPages,
    onPageChange,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  } = $props();

  function pages(): (number | '...')[] {
    const result: (number | '...')[] = [];
    const total = totalPages;
    const curr = currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) result.push(i);
      return result;
    }

    result.push(1);
    if (curr > 3) result.push('...');

    const start = Math.max(2, curr - 1);
    const end = Math.min(total - 1, curr + 1);
    for (let i = start; i <= end; i++) result.push(i);

    if (curr < total - 2) result.push('...');
    result.push(total);
    return result;
  }
</script>

{#if totalPages > 1}
  <div class="flex items-center justify-center gap-1 py-4">
    <button
      onclick={() => onPageChange(currentPage - 1)}
      disabled={currentPage <= 1}
      class="rounded-md px-2 py-1 text-sm
             text-[var(--fg-muted)]
             hover:text-[var(--fg)]
             disabled:opacity-30 transition-colors"
    >
      Prev
    </button>

    {#each pages() as p}
      {#if p === '...'}
        <span class="px-2 text-sm text-[var(--fg-muted)]"> ... </span>
      {:else}
        <button
          onclick={() => onPageChange(p)}
          class="rounded-md px-3 py-1 text-sm transition-colors
                 {p === currentPage
            ? 'bg-[var(--color-primary)] text-black font-medium'
            : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}"
        >
          {p}
        </button>
      {/if}
    {/each}

    <button
      onclick={() => onPageChange(currentPage + 1)}
      disabled={currentPage >= totalPages}
      class="rounded-md px-2 py-1 text-sm
             text-[var(--fg-muted)]
             hover:text-[var(--fg)]
             disabled:opacity-30 transition-colors"
    >
      Next
    </button>
  </div>
{/if}
