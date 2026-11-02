<script lang="ts">
  import { onMount } from 'svelte';

  import { goto, refreshAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { seatCount } from '#lib/events/availability.ts';
  import BookingTimeline from '#lib/events/BookingTimeline.svelte';
  import ErrorState from '#lib/ui/ErrorState.svelte';
  import Icon from '#lib/ui/Icon.svelte';
  import { dateAndTime } from '#lib/venue-date.ts';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();

  // A confirmation is not a URL: this page renders the booking handed over in the history entry.
  const booking = $derived(page.state.booking);

  onMount(() => {
    // A typed or shared address has no booking, and the page does not pretend otherwise.
    if (!booking) void goto(resolve('/events/[id]', { id: data.eventId }), { replaceState: true });
  });
</script>

<svelte:head>
  <title>Booking confirmed | Venue Desk</title>
</svelte:head>

{#if booking}
  <div class="container layout">
    <section class="ticket card" aria-labelledby="confirmed-heading">
      <span class="seal" aria-hidden="true"><Icon name="check" /></span>
      <p class="eyebrow">You are all set</p>
      <h1 id="confirmed-heading">Booking confirmed</h1>

      <dl class="reference">
        <dt>Your booking reference</dt>
        <dd class="code">{booking.reference}</dd>
      </dl>
      <p class="summary">
        {seatCount(booking.seats)} booked for {booking.name} ({booking.email}).
      </p>
      <p class="muted">Keep the reference: the venue will ask for it if you contact them.</p>

      <div class="event">
        {#if data.event.ok}
          <section aria-labelledby="event-heading">
            <h2 id="event-heading">{data.event.value.title}</h2>
            <p class="muted">
              <time datetime={data.event.value.startsAt}
                >{dateAndTime(data.event.value.startsAt)}</time
              >, {data.event.value.venue}
            </p>
          </section>
        {:else}
          <ErrorState
            heading="Your booking is confirmed, but the event details could not be loaded"
            problem={data.event.problem}
            onretry={() => refreshAll()}
          />
        {/if}
      </div>
    </section>

    <section class="next card" aria-labelledby="next-heading">
      <h2 id="next-heading">What happens next</h2>
      <BookingTimeline messages={booking.messages} />
      <a class="button" href={resolve('/')}>Back to all events</a>
    </section>
  </div>
{/if}

<style>
  .layout {
    display: grid;
    align-items: start;
    gap: var(--space-6);
    padding-block-start: var(--space-10);

    @media (min-width: 56rem) {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: var(--space-8);
    }
  }

  .ticket,
  .next {
    display: grid;
    justify-items: start;
    gap: var(--space-4);

    @media (min-width: 40rem) {
      padding: var(--space-8);
    }
  }

  .ticket {
    border-block-start: 4px solid var(--color-brass);
  }

  .seal {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background: var(--color-stage);
    color: var(--color-stage-accent);
    font-size: 1.4rem;
  }

  .reference {
    display: grid;
    gap: var(--space-1);
    width: 100%;
    padding: var(--space-5);
    border: 1px dashed var(--color-border-strong);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);

    dt {
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  }

  .code {
    color: var(--color-heading);
    font-family: var(--font-mono);
    font-size: clamp(1.75rem, 1.2rem + 2.4vw, 2.5rem);
    font-weight: var(--weight-bold);
    letter-spacing: 0.08em;
    overflow-wrap: anywhere;
  }

  .summary {
    font-size: var(--text-lg);
  }

  .event {
    width: 100%;
    padding-block-start: var(--space-4);
    border-block-start: 1px solid var(--color-border);
  }

  .next .button {
    margin-block-start: var(--space-2);
  }
</style>
