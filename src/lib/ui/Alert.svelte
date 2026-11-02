<script lang="ts">
  import type { Snippet } from 'svelte';

  let { tone, children }: { tone: 'warning' | 'danger'; children: Snippet } = $props();
</script>

<!-- Something that needs action interrupts the screen reader. -->
<div role="alert" data-tone={tone}>{@render children()}</div>

<style>
  div {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border: 1px solid color-mix(in srgb, var(--tone-fg) 25%, transparent);
    border-inline-start: var(--space-1) solid var(--tone-fg);
    border-radius: var(--radius-md);
    background: var(--tone-bg);
    color: var(--tone-fg);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }
</style>
