<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import SearchBar from './SearchBar.svelte';
  import EndpointInput from './EndpointInput.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  let mobileOpen = $state(false);

  const navItems = [
    { href: `${base}/`, label: 'Dashboard' },
    { href: `${base}/blocks`, label: 'Blocks' },
    { href: `${base}/transactions`, label: 'Transactions' },
    { href: `${base}/staking`, label: 'Staking' },
    { href: `${base}/analytics`, label: 'Analytics' },
  ];

  function isActive(href: string): boolean {
    const path = page.url.pathname;
    if (href === `${base}/`) return path === `${base}/` || path === base;
    return path.startsWith(href);
  }
</script>

<header
  class="sticky top-0 z-50 border-b bg-[var(--bg-raised)]
         border-[var(--bd)] backdrop-blur-sm"
>
  <div class="mx-auto max-w-7xl px-4 py-3">
    <div class="flex items-center justify-between gap-4">
      <a
        href="{base}/"
        class="flex items-center gap-2 text-xl font-bold
               text-[var(--color-primary)] no-underline"
      >
        <img src="{base}/zcash-icon.svg" alt="Zcash" class="h-7 w-7" />
        Crosslink Explorer
      </a>

      <nav class="hidden items-center gap-1 lg:flex">
        {#each navItems as item}
          <a
            href={item.href}
            class="rounded-md px-3 py-1.5 text-sm font-medium
                   no-underline transition-colors
                   {isActive(item.href)
              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
              : 'text-[var(--fg-muted)] hover:text-[var(--fg)]'}"
          >
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="hidden items-center gap-3 lg:flex">
        <SearchBar />
        <EndpointInput />
        <ThemeToggle />
      </div>

      <button
        class="rounded-md p-2 text-[var(--fg-muted)]
               hover:text-[var(--fg)] lg:hidden"
        onclick={() => (mobileOpen = !mobileOpen)}
        aria-label="Toggle menu"
      >
        {#if mobileOpen}
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        {:else}
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        {/if}
      </button>
    </div>

    {#if mobileOpen}
      <div
        class="mt-3 flex flex-col gap-2 border-t
                  border-[var(--bd)] pt-3 lg:hidden"
      >
        {#each navItems as item}
          <a
            href={item.href}
            class="rounded-md px-3 py-2 text-sm no-underline
                   {isActive(item.href)
              ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
              : 'text-[var(--fg-muted)]'}"
            onclick={() => (mobileOpen = false)}
          >
            {item.label}
          </a>
        {/each}
        <div class="flex flex-col gap-2 pt-2">
          <SearchBar />
          <EndpointInput />
          <ThemeToggle />
        </div>
      </div>
    {/if}
  </div>
</header>
