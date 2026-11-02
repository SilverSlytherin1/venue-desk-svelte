<script lang="ts">
  import { tick } from 'svelte';

  import { resolve } from '$app/paths';
  import { type ApiProblem, problemMessage } from '#lib/api/api-problem.ts';
  import { submitFeedback } from '#lib/api/feedback-api.ts';
  import type { FeedbackInvitation, FeedbackRequest } from '#lib/api/models.ts';
  import FormField from '#lib/forms/FormField.svelte';
  import { focusFirstInvalid, rejectionSummary } from '#lib/forms/validation.ts';
  import Alert from '#lib/ui/Alert.svelte';
  import Stars from '#lib/ui/Stars.svelte';
  import { longDate } from '#lib/venue-date.ts';
  import { RATING_WORDS } from './rating-words.ts';

  const MAX_COMMENT_LENGTH = 1000;
  const RATINGS = [1, 2, 3, 4, 5] as const;

  type Submission =
    | { status: 'idle' }
    | { status: 'submitting' }
    | { status: 'failed'; message: string }
    | { status: 'done'; rating: number };

  interface Props {
    token: string;
    invitation: FeedbackInvitation;
    /** The API already has an answer that the invitation on screen does not show. */
    onstale: () => void;
  }

  let { token, invitation, onstale }: Props = $props();

  let form = $state<HTMLFormElement>();
  let rating = $state(0);
  let comment = $state('');
  let attempted = $state(false);
  let submission = $state<Submission>({ status: 'idle' });
  let serverErrors = $state<{ rating?: string; comment?: string }>({});

  const ratingError = $derived(
    serverErrors.rating ??
      (attempted && rating === 0 ? 'Choose a rating from 1 to 5 stars.' : null),
  );

  async function send(event: SubmitEvent) {
    event.preventDefault();
    attempted = true;

    if (rating === 0) {
      await focusError();
      return;
    }

    const trimmed = comment.trim();
    const feedback: FeedbackRequest = trimmed ? { rating, comment: trimmed } : { rating };

    submission = { status: 'submitting' };
    const result = await submitFeedback(fetch, token, feedback);
    if (result.ok) submission = { status: 'done', rating: result.value.rating };
    else await onProblem(result.problem);
  }

  async function onProblem(problem: ApiProblem) {
    switch (problem.code) {
      case 'FEEDBACK_ALREADY_SUBMITTED':
        // Sent from another tab, or an answer that got lost on the way back: the API has it.
        submission = { status: 'idle' };
        onstale();
        break;
      case 'FEEDBACK_NOT_OPEN':
        fail('Feedback is not open for this booking any more.');
        break;
      case 'FEEDBACK_NOT_FOUND':
        fail('This feedback link no longer works.');
        break;
      case 'VALIDATION_FAILED':
        for (const { field, message } of problem.errors) {
          if (field === 'rating' || field === 'comment') serverErrors[field] = message;
        }
        fail(rejectionSummary(problem.errors, ['rating', 'comment']));
        await focusError();
        break;
      default:
        // A second send is harmless: the API keeps one answer per booking and says so.
        fail(problemMessage(problem));
    }
  }

  function fail(message: string) {
    submission = { status: 'failed', message };
  }

  async function focusError() {
    await tick();
    focusFirstInvalid(form);
  }
</script>

{#if submission.status === 'done' || invitation.submitted}
  {@const given = submission.status === 'done' ? submission.rating : (invitation.rating ?? 0)}
  <div class="thanks" role="status">
    {#if submission.status === 'done'}
      <h2>Thank you, {invitation.guestFirstName}</h2>
      <p>Your rating went straight to the team that ran the evening.</p>
    {:else}
      <h2>You already rated this evening</h2>
      <p>Thank you, {invitation.guestFirstName}. One answer per booking is kept.</p>
    {/if}
    {#if given > 0}
      <Stars rating={given} />
    {/if}
    <a class="button button--primary" href={resolve('/')}>See what is on next</a>
  </div>
{:else}
  <p class="greeting">
    Hi {invitation.guestFirstName}, thanks for coming on
    <time datetime={invitation.eventStartsAt}>{longDate(invitation.eventStartsAt)}</time>. It takes
    ten seconds.
  </p>

  {#if submission.status === 'failed'}
    <Alert tone="danger">{submission.message}</Alert>
  {/if}

  <form bind:this={form} onsubmit={send} novalidate>
    <fieldset class="rating" aria-describedby={ratingError ? 'rating-error' : undefined}>
      <legend>Your rating</legend>
      <div class="stars">
        {#each RATINGS as value (value)}
          <label class:on={rating >= value}>
            <input
              type="radio"
              name="rating"
              class="visually-hidden"
              {value}
              bind:group={rating}
              data-invalid={ratingError ? true : undefined}
              onchange={() => delete serverErrors.rating}
            />
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M12 3.5l2.6 5.3 5.9.9-4.25 4.1 1 5.8L12 16.9l-5.25 2.7 1-5.8L3.5 9.7l5.9-.9z"
              />
            </svg>
            <span class="visually-hidden">{value === 1 ? '1 star' : `${value} stars`}</span>
          </label>
        {/each}
      </div>
      <p class="word" aria-hidden="true">
        {rating > 0 ? RATING_WORDS[rating] : 'Choose 1 to 5 stars'}
      </p>
      {#if ratingError}
        <p id="rating-error" class="error">{ratingError}</p>
      {/if}
    </fieldset>

    <FormField
      label="Comment"
      optional
      hint="{comment.length} of {MAX_COMMENT_LENGTH} characters"
      error={serverErrors.comment ?? null}
    >
      {#snippet control(attributes)}
        <textarea
          {...attributes}
          rows="4"
          maxlength={MAX_COMMENT_LENGTH}
          placeholder="What made the evening, or what would make it better?"
          bind:value={comment}
          oninput={() => delete serverErrors.comment}></textarea>
      {/snippet}
    </FormField>

    <button
      type="submit"
      class="button button--primary button--block"
      disabled={submission.status === 'submitting'}
    >
      {submission.status === 'submitting' ? 'Sending...' : 'Send feedback'}
    </button>
  </form>
{/if}

<style>
  .greeting {
    color: var(--color-text-muted);
    font-size: var(--text-lg);
  }

  form {
    display: grid;
    gap: var(--space-6);
    margin-block-start: var(--space-2);
  }

  .rating {
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: 0;
  }

  legend {
    margin-block-end: var(--space-2);
    padding: 0;
    font-weight: var(--weight-medium);
  }

  .stars {
    display: flex;
    gap: var(--space-1);

    label {
      position: relative;
      display: grid;
      place-items: center;
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-md);
      color: var(--color-star-empty);
      cursor: pointer;
      transition: color var(--duration-fast);
    }

    svg {
      width: 2.4rem;
      height: 2.4rem;
      fill: currentColor;
    }

    .on {
      color: var(--color-star);
    }

    /* Hovering previews the rating: every star up to the pointer lights up, the rest go dim. */
    @media (hover: hover) {
      &:hover label {
        color: var(--color-star);
      }

      label:hover ~ label {
        color: var(--color-star-empty);
      }
    }

    label:has(input:focus-visible) {
      outline: 2px solid var(--color-focus);
      outline-offset: 2px;
    }
  }

  .word {
    min-height: 1.5rem;
    color: var(--color-brass-text);
    font-family: var(--font-display);
    font-size: var(--text-lg);
  }

  .error {
    color: var(--color-danger);
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
  }

  .thanks {
    display: grid;
    justify-items: center;
    gap: var(--space-3);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    background: var(--color-surface-sunken);
    text-align: center;

    p {
      color: var(--color-text-muted);
    }
  }
</style>
