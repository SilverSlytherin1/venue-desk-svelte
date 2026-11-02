<script lang="ts" module>
  /** Codes that mean the link itself is wrong, so trying again cannot help. */
  const BROKEN_LINK = ['FEEDBACK_NOT_FOUND', 'NOT_FOUND', 'VALIDATION_FAILED'];
</script>

<script lang="ts">
  import { refreshAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import FeedbackPanel from '#lib/feedback/FeedbackPanel.svelte';
  import ErrorState from '#lib/ui/ErrorState.svelte';
  import type { PageProps } from './$types';

  // The page a guest opens from the link in the email the day after the event. The token in the
  // URL is the only credential, so the page shows no more than the API returns for it.
  let { data }: PageProps = $props();

  const invitation = $derived(data.invitation);
</script>

<svelte:head>
  <title>Your feedback | Venue Desk</title>
</svelte:head>

<div class="container">
  <section class="sheet card" aria-labelledby="feedback-heading">
    <p class="eyebrow">Your feedback</p>
    <h1 id="feedback-heading">
      {invitation.ok ? `How was ${invitation.value.eventTitle}?` : 'Your feedback'}
    </h1>

    {#if invitation.ok}
      <FeedbackPanel
        token={data.token}
        invitation={invitation.value}
        onstale={() => refreshAll()}
      />
    {:else if BROKEN_LINK.includes(invitation.problem.code)}
      <div class="message" role="alert">
        <h2>This feedback link does not work</h2>
        <p>
          Check that the whole link was copied from the email. If it still fails, the booking may
          have been removed.
        </p>
        <a class="button" href={resolve('/')}>See upcoming events</a>
      </div>
    {:else if invitation.problem.code === 'FEEDBACK_NOT_OPEN'}
      <div class="message" role="alert">
        <h2>Feedback is not open yet</h2>
        <p>
          The link starts working once the event has begun. Feedback is not collected for a
          cancelled booking.
        </p>
        <a class="button" href={resolve('/')}>See upcoming events</a>
      </div>
    {:else}
      <ErrorState
        heading="Your feedback link could not be opened"
        problem={invitation.problem}
        onretry={() => refreshAll()}
      />
    {/if}
  </section>
</div>

<style>
  .container {
    padding-block-start: var(--space-12);
  }

  .sheet {
    display: grid;
    gap: var(--space-4);
    max-width: 42rem;
    margin-inline: auto;
    border-block-start: 4px solid var(--color-brass);

    @media (min-width: 40rem) {
      padding: var(--space-10);
    }

    h1 {
      text-wrap: pretty;
    }
  }

  .message {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);

    p {
      color: var(--color-text-muted);
    }
  }
</style>
