<script lang="ts">
  import { resolve } from '$app/paths';
  import type { VenueEvent } from '#lib/api/models.ts';
  import Icon from '#lib/ui/Icon.svelte';
  import { calendarLeaf, dateAndTime } from '#lib/venue-date.ts';
  import SeatAvailability from './SeatAvailability.svelte';

  let { event }: { event: VenueEvent } = $props();

  const leaf = $derived(calendarLeaf(event.startsAt));
</script>

<!-- A ticket-like card. The whole card is the click target; the title link is its name. -->
<article>
  <div class="band">
    <!-- Decoration: the full date is written out below. -->
    <div class="leaf" aria-hidden="true">
      <span class="caps">{leaf.month}</span>
      <span class="day">{leaf.day}</span>
      <span class="caps quiet">{leaf.weekday}</span>
    </div>
    <span class="room"><Icon name="pin" />{event.venue}</span>
  </div>
  <div class="body">
    <p class="when"><time datetime={event.startsAt}>{dateAndTime(event.startsAt)}</time></p>
    <h3><a href={resolve('/events/[id]', { id: event.id })}>{event.title}</a></h3>
    <p class="description">{event.description}</p>
    <div class="availability"><SeatAvailability {event} /></div>
  </div>
</article>

<style>
  article {
    position: relative;
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    transition:
      box-shadow var(--duration-base) var(--ease-out),
      transform var(--duration-base) var(--ease-out);

    @media (hover: hover) {
      &:hover {
        box-shadow: var(--shadow-lg);
        transform: translateY(-2px);
      }
    }
  }

  .band {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-5);
    background:
      radial-gradient(
        ellipse 70% 120% at 100% 0%,
        color-mix(in srgb, var(--color-stage-accent) 20%, transparent),
        transparent 70%
      ),
      var(--color-stage);
  }

  .leaf {
    display: inline-grid;
    justify-items: center;
    min-width: 4rem;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-raised);
    box-shadow: var(--shadow-md);
    color: var(--color-heading);
    line-height: 1.1;
  }

  .caps {
    color: var(--color-brass-text);
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }

  .quiet {
    color: var(--color-text-muted);
  }

  .day {
    font-family: var(--font-display);
    font-size: 1.9rem;
    font-weight: var(--weight-semibold);
  }

  .room {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-on-stage);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  .body {
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    gap: var(--space-2);
    padding: var(--space-5);
  }

  .when {
    color: var(--color-brass-text);
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }

  h3 {
    font-size: var(--text-xl);
  }

  a {
    color: inherit;
    text-decoration: none;

    /* The whole card is the click target, while the link text stays the accessible name. */
    &::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      border-radius: inherit;
    }

    &:focus-visible {
      outline: none;
    }

    &:focus-visible::after {
      outline: 2px solid var(--color-focus);
      outline-offset: -2px;
    }
  }

  .description {
    display: -webkit-box;
    overflow: hidden;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .availability {
    margin-block-start: var(--space-3);
  }
</style>
