<script lang="ts">
  import { onDestroy } from 'svelte';

  import type { Booking, VenueEvent } from '#lib/api/models.ts';
  import Alert from '#lib/ui/Alert.svelte';
  import { MAX_SEATS_PER_BOOKING } from './availability.ts';
  import BookingForm from './BookingForm.svelte';
  import { BookingFlow } from './booking-flow.svelte.ts';

  interface Props {
    event: VenueEvent;
    onbooked: (booking: Booking) => void;
    /** The event on screen is out of date and needs loading again. */
    onstale: () => void;
  }

  let { event, onbooked, onstale }: Props = $props();

  let form = $state<BookingForm>();

  // The page re-creates this panel for another event, so the id is fixed for its whole life.
  // svelte-ignore state_referenced_locally
  const flow = new BookingFlow(event.id, {
    booked: (booking) => {
      onbooked(booking);
    },
    stale: () => {
      onstale();
    },
    fieldErrors: (errors) => {
      form?.showServerErrors(errors);
    },
  });

  onDestroy(() => {
    flow.cancel();
  });

  const sent = $derived(flow.submission);
</script>

<section class="card" aria-labelledby="booking-heading">
  <h2 id="booking-heading">Book seats</h2>

  {#if sent.status === 'rejected'}
    <Alert tone="warning">{sent.message}</Alert>
  {:else if sent.status === 'unconfirmed'}
    <Alert tone="danger">
      <p>{sent.message}</p>
      <p>Trying again is safe: the same booking is never made twice.</p>
      <button type="button" class="button" onclick={() => flow.retry()}>Try again</button>
    </Alert>
  {/if}

  {#if sent.status === 'closed'}
    <p class="notice">Booking has closed because this event has already started.</p>
  {:else if event.seatsLeft === 0}
    <p class="notice">This event is sold out.</p>
  {:else}
    <BookingForm
      bind:this={form}
      maxSeats={Math.min(MAX_SEATS_PER_BOOKING, event.seatsLeft)}
      submitting={sent.status === 'submitting'}
      onsubmit={(details) => flow.book(details)}
    />
  {/if}
</section>

<style>
  section {
    display: grid;
    gap: var(--space-4);

    @media (min-width: 56rem) {
      position: sticky;
      inset-block-start: calc(4rem + var(--space-6));
    }
  }

  .notice {
    padding: var(--space-4);
    border-radius: var(--radius-md);
    background: var(--color-surface-sunken);
    font-weight: var(--weight-medium);
  }
</style>
