<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/common/Header.svelte';

  let { children } = $props();
</script>

<div class="flex min-h-screen flex-col">
  <Header />
  <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
    {@render children()}
  </main>
  <footer
    class="border-t border-[var(--bd)] py-4 text-center
           text-xs text-[var(--fg-muted)]"
  >
    Zcash Crosslink Explorer. Not affiliated with Electric Coin Company.
  </footer>
</div>
