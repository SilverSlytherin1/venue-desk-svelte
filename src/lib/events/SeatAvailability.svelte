<script lang="ts">
  import type { VenueEvent } from '#lib/api/models.ts';
  import { availabilityOf, seatCount } from './availability.ts';

  let { event }: { event: VenueEvent } = $props();

  const availability = $derived(availabilityOf(event));
  const seatsLeft = $derived(`${seatCount(event.seatsLeft)} left of ${event.capacity}`);
  const fill = $derived(
    event.capacity > 0 ? Math.min(1, (event.capacity - event.seatsLeft) / event.capacity) : 1,
  );
</script>

<!-- Seats left as text, a state badge when it matters, and a meter of how full the room is. -->
<div class="seats">
  <div class="line">
    {#if availability === 'sold-out'}
      <span class="badge" data-tone="danger">Sold out</span>
    {:else}
      {#if availability === 'few-left'}
        <span class="badge" data-tone="warning">Last seats</span>
      {/if}
      <span>{seatsLeft}</span>
    {/if}
  </div>
  <div
    class="meter"
    aria-hidden="true"
    class:low={availability === 'few-left'}
    class:full={availability === 'sold-out'}
    style:--fill={fill}
  ></div>
</div>

<style>
  .seats {
    display: grid;
    gap: var(--space-2);
  }

  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    min-height: 1.5rem;
    color: var(--seat-text, var(--color-text-muted));
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }

  .badge {
    padding: 0 var(--space-2);
    border-radius: var(--radius-full);
    background: var(--tone-bg);
    color: var(--tone-fg);
    font-size: var(--text-xs);
    font-weight: var(--weight-semibold);
  }

  .meter {
    position: relative;
    height: 0.5rem;
    overflow: hidden;
    border-radius: var(--radius-full);
    background: var(--meter-track, var(--color-meter-track));
  }

  .meter::after {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: calc(var(--fill) * 100%);
    border-radius: inherit;
    background: var(--meter-fill, var(--color-meter-fill));
    transition: width var(--duration-base) var(--ease-out);
  }

  .low::after {
    background: var(--color-meter-low);
  }

  .full::after {
    background: var(--color-meter-full);
  }
</style>
