<script lang="ts" module>
  import type { IconName } from '#lib/ui/Icon.svelte';
  import type { BookingMessage, MessageKind } from '#lib/api/models.ts';

  const ICONS: Record<MessageKind, IconName> = {
    CONFIRMATION: 'mail',
    REMINDER: 'bell',
    FEEDBACK_REQUEST: 'star',
  };

  const DETAILS: Record<MessageKind, string> = {
    CONFIRMATION: 'Your reference and the event details, by email.',
    REMINDER: 'The day before, with the time, the room and your reference.',
    FEEDBACK_REQUEST: 'The day after, one link to rate the evening from 1 to 5.',
  };

  function title({ kind, status, scheduledFor }: BookingMessage): string {
    switch (kind) {
      case 'CONFIRMATION':
        return status === 'SENT' ? 'Confirmation sent' : 'Confirmation on its way';
      case 'REMINDER':
        return `Reminder on ${shortDate(scheduledFor)}`;
      case 'FEEDBACK_REQUEST':
        return `Feedback request on ${shortDate(scheduledFor)}`;
    }
  }
</script>

<script lang="ts">
  import Icon from '#lib/ui/Icon.svelte';
  import { shortDate } from '#lib/venue-date.ts';

  // "What happens next", built from the messages the API scheduled for the booking. The reminder
  // is only there when the event was far enough away to schedule one, so nothing here is assumed.
  let { messages }: { messages: readonly BookingMessage[] } = $props();
</script>

<ol>
  {#each messages as message (message.kind)}
    <li class:done={message.status === 'SENT'} class:off={message.status === 'CANCELLED'}>
      <span class="dot"><Icon name={ICONS[message.kind]} /></span>
      <div>
        <h3>{title(message)}</h3>
        <p>
          {message.status === 'CANCELLED' ? 'Cancelled with the booking.' : DETAILS[message.kind]}
        </p>
      </div>
    </li>
  {/each}
</ol>

<style>
  ol {
    display: grid;
    width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-4);
    padding-block-end: var(--space-6);
  }

  li:last-child {
    padding-block-end: 0;
  }

  /* The line that joins one step to the next. */
  li:not(:last-child)::before {
    content: '';
    position: absolute;
    inset: 2.75rem auto 0.25rem calc(1.25rem - 1px);
    border-inline-start: 2px dashed var(--color-border-strong);
  }

  .dot {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 2px solid var(--color-border-strong);
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-muted);
  }

  .done .dot {
    border-color: var(--color-stage);
    background: var(--color-stage);
    color: var(--color-stage-accent);
  }

  h3 {
    padding-block-start: var(--space-2);
    font-size: var(--text-lg);
  }

  p {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  .off h3 {
    color: var(--color-text-muted);
    text-decoration: line-through;
  }
</style>
