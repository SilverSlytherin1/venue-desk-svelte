<script lang="ts">
  import { goto, refreshAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import type { Booking } from '#lib/api/models.ts';
  import BookingPanel from '#lib/events/BookingPanel.svelte';
  import SeatAvailability from '#lib/events/SeatAvailability.svelte';
  import ErrorState from '#lib/ui/ErrorState.svelte';
  import Icon from '#lib/ui/Icon.svelte';
  import { dateAndTime } from '#lib/venue-date.ts';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  const event = $derived(data.event.ok ? data.event.value : null);

  function showConfirmation(booking: Booking) {
    // `persistState` keeps the booking in this history entry, so a reload still has it.
    void goto(resolve('/events/[id]/booked', { id: booking.eventId }), {
      state: { booking },
      persistState: true,
    });
  }
</script>

<svelte:head>
  <title>{event?.title ?? 'Event'} | Venue Desk</title>
</svelte:head>

<section class="band" aria-labelledby="event-title">
  <div class="container band-inner">
    <a class="back-link" href={resolve('/')}>All events</a>
    {#if event}
      <p class="eyebrow">{event.venue}</p>
    {/if}
    <h1 id="event-title">{event?.title ?? 'Event'}</h1>
    {#if event}
      <dl class="facts">
        <div>
          <dt><Icon name="calendar" />When</dt>
          <dd><time datetime={event.startsAt}>{dateAndTime(event.startsAt)}</time></dd>
        </div>
        <div>
          <dt><Icon name="pin" />Where</dt>
          <dd>{event.venue}</dd>
        </div>
        <div class="seats">
          <dt><Icon name="seat" />Seats</dt>
          <dd><SeatAvailability {event} /></dd>
        </div>
      </dl>
    {/if}
  </div>
</section>

<div class="container content">
  {#if !data.event.ok}
    <ErrorState
      heading="This event could not be loaded"
      problem={data.event.problem}
      onretry={() => refreshAll()}
    />
  {:else if event}
    <div class="layout">
      <section class="about" aria-labelledby="about-heading">
        <h2 id="about-heading">About this event</h2>
        <p class="description">{event.description}</p>
        <ul class="perks">
          <li><Icon name="check" />Up to four seats per booking, free of charge</li>
          <li><Icon name="bell" />A reminder by email the day before</li>
          <li><Icon name="star" />One link afterwards to tell us how it went</li>
        </ul>
      </section>

      <!-- The router keeps this page when only the id changes: a booking starts over with it. -->
      {#key event.id}
        <BookingPanel {event} onbooked={showConfirmation} onstale={() => refreshAll()} />
      {/key}
    </div>
  {/if}
</div>

<style>
  .band {
    padding-block: var(--space-6) var(--space-10);
    background:
      radial-gradient(
        ellipse 50% 90% at 90% 0%,
        color-mix(in srgb, var(--color-stage-accent) 18%, transparent),
        transparent 70%
      ),
      var(--color-stage);
    color: var(--color-on-stage);
  }

  .band-inner {
    display: grid;
    gap: var(--space-3);
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    justify-self: start;
    gap: var(--space-2);
    min-height: var(--control-height);
    color: var(--color-on-stage-muted);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    text-decoration: none;

    &::before {
      content: '\2190';
    }

    @media (hover: hover) {
      &:hover {
        color: var(--color-on-stage);
        text-decoration: underline;
      }
    }
  }

  .eyebrow {
    color: var(--color-stage-accent);
  }

  h1 {
    max-width: 24ch;
    color: var(--color-on-stage);
    font-size: var(--text-display);
    font-weight: var(--weight-medium);
  }

  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(13rem, 100%), 1fr));
    gap: var(--space-4) var(--space-8);
    margin-block-start: var(--space-4);
    padding-block-start: var(--space-5);
    border-block-start: 1px solid var(--color-stage-border);
  }

  dt {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-block-end: var(--space-1);
    color: var(--color-stage-accent);
    font-size: var(--text-xs);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }

  dd {
    font-weight: var(--weight-medium);
  }

  /* The seat line sits on the dark band here, so it takes the band's colours. */
  .seats {
    --seat-text: var(--color-on-stage);
    --meter-track: var(--color-stage-raised);
    --meter-fill: var(--color-stage-accent);
  }

  .content {
    margin-block-start: var(--space-10);
  }

  .layout {
    display: grid;
    align-items: start;
    gap: var(--space-8);

    /* The booking card moves beside the description once both have a readable width. */
    @media (min-width: 56rem) {
      grid-template-columns: minmax(0, 1fr) minmax(0, var(--form-width));
      gap: var(--space-12);
    }
  }

  .about {
    display: grid;
    gap: var(--space-4);
  }

  .description {
    max-width: var(--measure);
    font-size: var(--text-lg);
    white-space: pre-line;
  }

  .perks {
    display: grid;
    gap: var(--space-3);
    margin-block-start: var(--space-2);
    padding: var(--space-5);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);

    li {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  }
</style>
