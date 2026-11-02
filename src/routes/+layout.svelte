<script lang="ts">
  import '#lib/styles/tokens.css';
  import '#lib/styles/base.css';

  import type { Snippet } from 'svelte';

  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { navigating } from '$app/state';
  import Brand from '#lib/ui/Brand.svelte';

  let { children }: { children: Snippet } = $props();

  let main = $state<HTMLElement>();

  // Without this a single-page app changes screen silently: focus stays on the link that was
  // clicked and a screen reader announces nothing. The first load keeps the browser default, so
  // the skip link is the first tab stop.
  afterNavigate(({ type, from, to }) => {
    if (type === 'enter' || from?.url.pathname === to?.url.pathname) return;
    const heading = main?.querySelector('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  });
</script>

<a class="skip-link button" href="#main">Skip to content</a>

<div class="page">
  <header>
    <div class="container bar">
      <a class="brand" href={resolve('/')} aria-label="Venue Desk, home"><Brand /></a>
      <nav aria-label="Main"><a class="link" href={resolve('/')}>Events</a></nav>
    </div>
    <!-- A navigation waits for its `load`, so this is what shows that something is happening. -->
    {#if navigating.to}
      <div class="progress" aria-hidden="true"></div>
    {/if}
  </header>

  <div class="visually-hidden" role="status">{navigating.to ? 'Loading page' : ''}</div>

  <main id="main" tabindex="-1" bind:this={main}>
    {@render children()}
  </main>

  <footer>
    <div class="container">
      <p>A demo venue: no payments, and messages are not sent.</p>
    </div>
  </footer>
</div>

<style>
  .skip-link {
    position: fixed;
    inset-block-start: var(--space-2);
    inset-inline-start: var(--space-2);
    z-index: 10;

    /* Off screen until a keyboard user reaches it, then drawn over the header. */
    &:not(:focus-visible) {
      width: 1px;
      height: 1px;
      min-height: 0;
      padding: 0;
      overflow: hidden;
      clip-path: inset(50%);
    }
  }

  .page {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto 1fr auto;
    min-height: 100dvh;
  }

  header {
    position: sticky;
    inset-block-start: 0;
    z-index: 5;
    border-block-end: 1px solid var(--color-border);
    background: color-mix(in srgb, var(--color-canvas) 88%, transparent);
    backdrop-filter: saturate(1.4) blur(10px);
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    min-height: 4rem;
  }

  .brand {
    color: var(--color-heading);
    text-decoration: none;
  }

  .link {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-semibold);
    text-decoration: none;

    @media (hover: hover) {
      &:hover {
        color: var(--color-text);
      }
    }
  }

  .progress {
    position: absolute;
    inset: auto 0 -1px;
    height: 2px;
    background: var(--color-brass);
    transform-origin: left;
    animation: progress 900ms var(--ease-out) infinite;
  }

  @keyframes progress {
    from {
      transform: scaleX(0);
    }

    to {
      transform: scaleX(1);
    }
  }

  main {
    min-width: 0;
    padding-block-end: var(--space-16);

    /* Focused by the skip link only as a starting point for the next Tab. */
    &:focus {
      outline: none;
    }
  }

  footer {
    padding-block: var(--space-8);
    background: var(--color-stage);
    color: var(--color-on-stage-muted);
    font-size: var(--text-sm);
  }
</style>
