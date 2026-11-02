<script lang="ts">
  let { rating }: { rating: number } = $props();

  const stars = $derived(Array.from({ length: 5 }, (_, i) => i < Math.round(rating)));
</script>

<!-- A rating drawn as stars: one image with a name, so it is read as "4 out of 5". -->
<span role="img" aria-label="{rating} out of 5">
  {#each stars as filled, index (index)}
    <svg viewBox="0 0 24 24" class:filled focusable="false">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z" />
    </svg>
  {/each}
</span>

<style>
  span {
    display: inline-flex;
    gap: 0.1em;
    font-size: 1.75rem;
    line-height: 1;
  }

  svg {
    width: 1em;
    height: 1em;
    fill: var(--color-star-empty);
  }

  .filled {
    fill: var(--color-star);
  }
</style>
