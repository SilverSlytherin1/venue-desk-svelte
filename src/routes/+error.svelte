<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  const notFound = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{notFound ? 'Page not found' : 'Something went wrong'} | Venue Desk</title>
</svelte:head>

<div class="sheet">
  <p class="code" aria-hidden="true">{page.status}</p>
  {#if notFound}
    <h1>Page not found</h1>
    <p class="muted">The address may be mistyped, or the page may have moved.</p>
  {:else}
    <h1>Something went wrong</h1>
    <p class="muted">Reloading the page may help.</p>
  {/if}
  <a class="button button--primary" href={resolve('/')}>Go to events</a>
</div>

<style>
  .sheet {
    display: grid;
    justify-items: center;
    gap: var(--space-4);
    max-width: 32rem;
    margin: var(--space-16) auto 0;
    padding-inline: var(--space-4);
    text-align: center;
  }

  .code {
    color: var(--color-brass-text);
    font-family: var(--font-display);
    font-size: clamp(4rem, 3rem + 6vw, 7rem);
    font-weight: var(--weight-medium);
    line-height: 1;
    letter-spacing: -0.04em;
  }
</style>
