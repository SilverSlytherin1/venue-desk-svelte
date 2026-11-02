<script lang="ts">
  import { refreshAll } from '$app/navigation';
  import EventCard from '#lib/events/EventCard.svelte';
  import ErrorState from '#lib/ui/ErrorState.svelte';
  import Icon from '#lib/ui/Icon.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>Upcoming events | Venue Desk</title>
</svelte:head>

<section class="hero" aria-labelledby="hero-heading">
  <div class="container hero-inner">
    <p class="eyebrow">Live at the venue</p>
    <h1 id="hero-heading">Evenings worth leaving the house for</h1>
    <p class="lead">
      Jazz, poetry, comedy and talks in two rooms. Book up to four seats in under a minute, with no
      account and no fees.
    </p>
  </div>
</section>

<div class="container">
  <section class="steps card" aria-labelledby="steps-heading">
    <h2 id="steps-heading" class="eyebrow">How it works</h2>
    <ol>
      <li>
        <span class="step-icon"><Icon name="ticket" /></span>
        <div>
          <h3>Book your seats</h3>
          <p>Pick an evening, tell us your name and email, and your seats are held at once.</p>
        </div>
      </li>
      <li>
        <span class="step-icon"><Icon name="bell" /></span>
        <div>
          <h3>Reminder the day before</h3>
          <p>A short note the day before with the time, the room and your booking reference.</p>
        </div>
      </li>
      <li>
        <span class="step-icon"><Icon name="star" /></span>
        <div>
          <h3>Tell us how it went</h3>
          <p>The morning after, one link to rate the evening. It takes ten seconds.</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="programme" aria-labelledby="programme-heading">
    <div class="section-heading">
      <h2 id="programme-heading">Upcoming events</h2>
      {#if data.events.ok && data.events.value.total > data.events.value.items.length}
        <p class="muted">
          The next {data.events.value.items.length} of {data.events.value.total}, soonest first.
        </p>
      {:else}
        <p class="muted">Soonest first.</p>
      {/if}
    </div>

    {#if !data.events.ok}
      <ErrorState
        heading="The events could not be loaded"
        problem={data.events.problem}
        onretry={() => refreshAll()}
      />
    {:else if data.events.value.total === 0}
      <div class="empty card">
        <h3>No upcoming events</h3>
        <p class="muted">
          Nothing is scheduled right now. New dates appear here as soon as they are announced.
        </p>
      </div>
    {:else}
      <ul class="cards" aria-labelledby="programme-heading">
        {#each data.events.value.items as event (event.id)}
          <li><EventCard {event} /></li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  .hero {
    padding-block: var(--space-16) calc(var(--space-20) + var(--space-8));
    background:
      radial-gradient(
        ellipse 60% 80% at 85% 0%,
        color-mix(in srgb, var(--color-stage-accent) 22%, transparent),
        transparent 60%
      ),
      var(--color-stage);
    color: var(--color-on-stage);
  }

  .hero-inner {
    display: grid;
    justify-items: start;
    gap: var(--space-4);
  }

  .eyebrow {
    color: var(--color-stage-accent);
  }

  h1 {
    max-width: 18ch;
    color: var(--color-on-stage);
    font-size: var(--text-display);
    font-weight: var(--weight-medium);
    letter-spacing: -0.02em;
  }

  .lead {
    max-width: 34rem;
    color: var(--color-on-stage-muted);
    font-size: var(--text-lg);
  }

  /* The step strip overlaps the bottom of the hero band. */
  .steps {
    position: relative;
    display: grid;
    gap: var(--space-5);
    margin-block-start: calc(var(--space-20) * -1);
    box-shadow: var(--shadow-lg);

    .eyebrow {
      font-family: var(--font-sans);
      color: var(--color-brass-text);
    }

    ol {
      display: grid;
      gap: var(--space-6);
      margin: 0;
      padding: 0;
      list-style: none;

      @media (min-width: 52rem) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--space-8);
      }
    }

    li {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: start;
      gap: var(--space-4);
    }

    h3 {
      margin-block-end: var(--space-1);
    }

    p {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  }

  .step-icon {
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    border: 1px solid var(--color-stage-border);
    border-radius: var(--radius-md);
    background: var(--color-stage);
    color: var(--color-stage-accent);
    font-size: 1.15rem;
  }

  .programme {
    display: grid;
    gap: var(--space-6);
    margin-block-start: var(--space-16);
  }

  .section-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2) var(--space-4);
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
    gap: var(--space-6);
  }

  .empty {
    display: grid;
    gap: var(--space-2);
  }
</style>
