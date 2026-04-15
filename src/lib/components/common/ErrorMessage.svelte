<script lang="ts">
  let { message }: { message: string } = $props();
</script>

<div
  class="rounded-lg border border-[var(--color-danger)]/30
         bg-[var(--color-danger)]/10 p-4 text-center"
>
  <p class="text-sm text-[var(--color-danger)]">{message}</p>
</div>
