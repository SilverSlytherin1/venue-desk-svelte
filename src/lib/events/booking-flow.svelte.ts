import { type ApiProblem, type FieldError, problemMessage } from '#lib/api/api-problem.ts';
import { bookSeats } from '#lib/api/events-api.ts';
import type { Booking, BookingRequest } from '#lib/api/models.ts';
import { rejectionSummary } from '#lib/forms/validation.ts';
import { seatCount } from './availability.ts';

export type Submission =
  | { status: 'idle' }
  | { status: 'submitting' }
  /** The API answered and said no. The message says what to change. */
  | { status: 'rejected'; message: string }
  /** No usable answer, so nobody knows whether the booking exists. Only here is a replay safe. */
  | { status: 'unconfirmed'; message: string }
  /** The API reports that the event has started, which the client cannot know reliably. */
  | { status: 'closed' };

interface Attempt {
  details: BookingRequest;
  idempotencyKey: string;
}

export interface BookingOutcomes {
  booked(booking: Booking): void;
  /** The event on screen is out of date. */
  stale(): void;
  fieldErrors(errors: readonly FieldError[]): void;
}

/** The booking of one event: what was sent, under which key, and how it ended. */
export class BookingFlow {
  submission = $state<Submission>({ status: 'idle' });

  #attempt: Attempt | null = null;
  #inFlight: AbortController | null = null;
  readonly #eventId: string;
  readonly #outcomes: BookingOutcomes;

  constructor(eventId: string, outcomes: BookingOutcomes) {
    this.#eventId = eventId;
    this.#outcomes = outcomes;
  }

  async book(details: BookingRequest): Promise<void> {
    // One key per distinct submission. Sending the same details again replays the key, so the API
    // returns the original booking instead of taking the seats twice. Edited details are a new
    // submission, which the API would reject under the old key.
    if (!this.#attempt || !isSameRequest(this.#attempt.details, details)) {
      this.#attempt = { details, idempotencyKey: crypto.randomUUID() };
    }

    this.#inFlight = new AbortController();
    const { signal } = this.#inFlight;
    this.submission = { status: 'submitting' };

    const { idempotencyKey } = this.#attempt;
    const result = await bookSeats(fetch, this.#eventId, details, idempotencyKey, signal);
    if (signal.aborted) return;

    if (result.ok) this.#outcomes.booked(result.value);
    else this.#onProblem(result.problem, details);
  }

  async retry(): Promise<void> {
    if (this.#attempt) await this.book(this.#attempt.details);
  }

  /** The guest left the page: a late answer must not act on it. */
  cancel(): void {
    this.#inFlight?.abort();
  }

  #onProblem(problem: ApiProblem, details: BookingRequest): void {
    switch (problem.code) {
      case 'EVENT_SOLD_OUT':
        this.#reject(soldOutMessage(problem.seatsLeft));
        // Someone else booked in the meantime: show the real availability, not the stale one.
        this.#outcomes.stale();
        break;
      case 'EVENT_CLOSED':
        this.submission = { status: 'closed' };
        break;
      case 'VALIDATION_FAILED':
        this.#reject(rejectionSummary(problem.errors, Object.keys(details)));
        this.#outcomes.fieldErrors(problem.errors);
        break;
      case 'NOT_FOUND':
        this.#reject('This event is no longer available.');
        this.#outcomes.stale();
        break;
      case 'IDEMPOTENCY_KEY_REUSED':
        // The API has seen this key with other details, so replaying it can never succeed.
        this.#attempt = null;
        this.#reject('This booking could not be sent. Press "Book seats" to send it again.');
        break;
      case 'NETWORK_ERROR':
      case 'INTERNAL_ERROR':
        this.submission = { status: 'unconfirmed', message: problemMessage(problem) };
        break;
      default:
        // Includes RATE_LIMITED: nothing was booked, and its wording asks the user to wait.
        this.#reject(problemMessage(problem));
    }
  }

  #reject(message: string): void {
    this.submission = { status: 'rejected', message };
  }
}

function isSameRequest(a: BookingRequest, b: BookingRequest): boolean {
  return a.name === b.name && a.email === b.email && a.seats === b.seats;
}

function soldOutMessage(seatsLeft: number): string {
  return seatsLeft === 0
    ? 'The last seats were booked while you were filling in the form.'
    : `Not enough seats: only ${seatCount(seatsLeft)} left. Choose fewer seats and try again.`;
}
