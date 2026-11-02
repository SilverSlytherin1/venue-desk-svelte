<script lang="ts">
  import { tick } from 'svelte';

  import type { FieldError } from '#lib/api/api-problem.ts';
  import type { BookingRequest } from '#lib/api/models.ts';
  import FormField from '#lib/forms/FormField.svelte';
  import {
    emailError,
    focusFirstInvalid,
    requiredError,
    wholeNumberError,
  } from '#lib/forms/validation.ts';
  import { MAX_SEATS_PER_BOOKING, seatCount } from './availability.ts';

  type Field = keyof BookingRequest;

  interface Props {
    /** The most seats one booking can take right now: the contract limit, capped by seats left. */
    maxSeats: number;
    submitting: boolean;
    onsubmit: (details: BookingRequest) => void;
  }

  let { maxSeats, submitting, onsubmit }: Props = $props();

  let form = $state<HTMLFormElement>();
  let name = $state('');
  let email = $state('');
  let seats = $state<number | null>(1);

  // A field shows its error once it has been left, or after a submit attempt.
  let touched = $state<Partial<Record<Field, boolean>>>({});
  let serverErrors = $state<Partial<Record<Field, string>>>({});

  // Derived, so availability dropping while the form is open revalidates the seats by itself.
  const errors = $derived({
    name: serverErrors.name ?? requiredError(name, 'Full name'),
    email: serverErrors.email ?? emailError(email),
    seats: serverErrors.seats ?? wholeNumberError(seats, 'Seats', 1, maxSeats),
  });

  const seatsHint = $derived(
    maxSeats < MAX_SEATS_PER_BOOKING
      ? `Only ${seatCount(maxSeats)} left.`
      : `Up to ${seatCount(MAX_SEATS_PER_BOOKING)} per booking.`,
  );

  const shown = (field: Field) => (touched[field] ? errors[field] : null);

  async function focusError() {
    await tick();
    focusFirstInvalid(form);
  }

  /** Puts the API's field errors on the matching fields, where the next edit clears them. */
  export function showServerErrors(fieldErrors: readonly FieldError[]) {
    for (const { field, message } of fieldErrors) {
      if (field === 'name' || field === 'email' || field === 'seats') {
        serverErrors[field] = message;
        touched[field] = true;
      }
    }
    void focusError();
  }

  function submit(event: SubmitEvent) {
    event.preventDefault();
    touched = { name: true, email: true, seats: true };

    // The submit button is never disabled for an invalid form: it could not explain what is wrong.
    if (errors.name || errors.email || errors.seats) void focusError();
    else onsubmit({ name: name.trim(), email: email.trim(), seats: seats ?? 0 });
  }
</script>

<form bind:this={form} onsubmit={submit} novalidate>
  <FormField label="Full name" error={shown('name')}>
    {#snippet control(attributes)}
      <input
        {...attributes}
        type="text"
        autocomplete="name"
        bind:value={name}
        oninput={() => delete serverErrors.name}
        onblur={() => (touched.name = true)}
      />
    {/snippet}
  </FormField>

  <FormField label="Email" error={shown('email')}>
    {#snippet control(attributes)}
      <input
        {...attributes}
        type="email"
        autocomplete="email"
        bind:value={email}
        oninput={() => delete serverErrors.email}
        onblur={() => (touched.email = true)}
      />
    {/snippet}
  </FormField>

  <FormField label="Seats" hint={seatsHint} error={shown('seats')}>
    {#snippet control(attributes)}
      <input
        {...attributes}
        class="seats"
        type="number"
        inputmode="numeric"
        step="1"
        min="1"
        max={maxSeats}
        bind:value={seats}
        oninput={() => delete serverErrors.seats}
        onblur={() => (touched.seats = true)}
      />
    {/snippet}
  </FormField>

  <button type="submit" class="button button--primary button--block" disabled={submitting}>
    {submitting ? 'Booking...' : 'Book seats'}
  </button>
</form>

<style>
  form {
    display: grid;
    gap: var(--space-4);
  }

  input.seats {
    max-width: 8rem;
  }

  button {
    margin-block-start: var(--space-2);
  }
</style>
