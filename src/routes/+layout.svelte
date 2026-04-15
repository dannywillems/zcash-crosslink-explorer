<script lang="ts">
  import { onMount } from 'svelte';
  import '../app.css';
  import Header from '$lib/components/common/Header.svelte';
  import { autoConnect } from '$lib/stores/endpoint.js';

  let { children } = $props();

  onMount(() => {
    autoConnect();
  });
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
    Zcash Crosslink Explorer -
    <a
      href="https://github.com/dannywillems/zcash-crosslink-explorer"
      target="_blank"
      rel="noopener noreferrer"
      class="hover:text-[var(--fg)]"
    >
      GitHub
    </a>
  </footer>
</div>
