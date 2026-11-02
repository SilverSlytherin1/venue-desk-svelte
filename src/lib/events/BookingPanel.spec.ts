import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Booking, VenueEvent } from '#lib/api/models.ts';
import {
  bookingFixture,
  eventFixture,
  json,
  problem,
  sentBy,
  stubFetch,
} from '../../test-support.ts';
import BookingPanel from './BookingPanel.svelte';

const event: VenueEvent = eventFixture;
const booking = bookingFixture as Booking;

function setup(overrides: Partial<VenueEvent> = {}) {
  const onbooked = vi.fn<(booking: Booking) => void>();
  const onstale = vi.fn<() => void>();
  const view = render(BookingPanel, { event: { ...event, ...overrides }, onbooked, onstale });
  return { onbooked, onstale, ...view };
}

async function fill(user: UserEvent, seats = '2') {
  await user.type(screen.getByRole('textbox', { name: 'Full name' }), 'Lena Varga');
  await user.type(screen.getByRole('textbox', { name: 'Email' }), 'lena@example.com');
  const seatsField = screen.getByRole('spinbutton', { name: 'Seats' });
  await user.clear(seatsField);
  await user.type(seatsField, seats);
}

const bookButton = () => screen.getByRole('button', { name: 'Book seats' });

describe('BookingPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the details with a key and hands over the booking the API returned', async () => {
    const stub = stubFetch(json(booking, 201));
    const user = userEvent.setup();
    const { onbooked } = setup();

    await fill(user);
    await user.click(bookButton());

    await waitFor(() => {
      expect(onbooked).toHaveBeenCalledWith(booking);
    });
    expect(stub.mock.calls[0]?.[0]).toBe(`/api/v1/events/${event.id}/bookings`);
    const { body, headers } = sentBy(stub, 0);
    expect(body).toEqual({ name: 'Lena Varga', email: 'lena@example.com', seats: 2 });
    expect(headers['idempotency-key']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('moves focus to the first invalid field and ties the error to it', async () => {
    const stub = stubFetch();
    const user = userEvent.setup();
    setup();

    await user.click(bookButton());

    const name = screen.getByRole('textbox', { name: 'Full name' });
    await waitFor(() => {
      expect(name).toHaveFocus();
    });
    expect(name).toHaveAccessibleDescription('Full name is required.');
    expect(stub).not.toHaveBeenCalled();
  });

  it('limits the seats to what is left', async () => {
    stubFetch();
    const user = userEvent.setup();
    setup({ seatsLeft: 2 });

    expect(screen.getByText('Only 2 seats left.')).toBeInTheDocument();
    await fill(user, '3');
    await user.click(bookButton());

    const seats = screen.getByRole('spinbutton', { name: 'Seats' });
    expect(seats).toHaveAccessibleDescription('Only 2 seats left. Seats must be 2 or less.');
  });

  it('replays the key on "Try again" when the outcome is unknown', async () => {
    const stub = stubFetch(new TypeError('offline'), json(booking, 201));
    const user = userEvent.setup();
    const { onbooked } = setup();

    await fill(user);
    await user.click(bookButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be reached');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(onbooked).toHaveBeenCalledOnce();
    });
    expect(sentBy(stub, 1).headers['idempotency-key']).toBe(
      sentBy(stub, 0).headers['idempotency-key'],
    );
  });

  it('sends the same details under the same key, and edited details under a new one', async () => {
    const stub = stubFetch(
      problem(500, 'INTERNAL_ERROR'),
      problem(500, 'INTERNAL_ERROR'),
      json(booking, 201),
    );
    const user = userEvent.setup();
    setup();

    await fill(user);
    await user.click(bookButton());
    await screen.findByRole('alert');
    await user.click(bookButton());
    await waitFor(() => {
      expect(stub).toHaveBeenCalledTimes(2);
    });
    await screen.findByRole('alert');

    await user.type(screen.getByRole('textbox', { name: 'Full name' }), ' Jr');
    await user.click(bookButton());
    await waitFor(() => {
      expect(stub).toHaveBeenCalledTimes(3);
    });

    const keys = [0, 1, 2].map((call) => sentBy(stub, call).headers['idempotency-key']);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
  });

  it('says how many seats are left after a sell-out and offers no retry', async () => {
    stubFetch(problem(409, 'EVENT_SOLD_OUT', { seatsLeft: 1 }));
    const user = userEvent.setup();
    const { onstale } = setup();

    await fill(user, '3');
    await user.click(bookButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('only 1 seat left');
    expect(onstale).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveValue('Lena Varga');
  });

  it('replaces the form when the event has started', async () => {
    stubFetch(problem(409, 'EVENT_CLOSED'));
    const user = userEvent.setup();
    setup();

    await fill(user);
    await user.click(bookButton());

    expect(await screen.findByText(/Booking has closed/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Book seats' })).not.toBeInTheDocument();
  });

  it('asks to wait after a rate limit, with no retry button', async () => {
    stubFetch(problem(429, 'RATE_LIMITED'));
    const user = userEvent.setup();
    setup();

    await fill(user);
    await user.click(bookButton());

    expect(await screen.findByRole('alert')).toHaveTextContent('Wait a moment');
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('asks for a fresh send after a reused key, under a new key', async () => {
    const stub = stubFetch(problem(409, 'IDEMPOTENCY_KEY_REUSED'), json(booking, 201));
    const user = userEvent.setup();
    setup();

    await fill(user);
    await user.click(bookButton());
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be sent');

    await user.click(bookButton());
    await waitFor(() => {
      expect(stub).toHaveBeenCalledTimes(2);
    });

    expect(sentBy(stub, 1).headers['idempotency-key']).not.toBe(
      sentBy(stub, 0).headers['idempotency-key'],
    );
  });

  it('shows a validation error on its field, focuses it, and clears it on the next edit', async () => {
    stubFetch(
      problem(422, 'VALIDATION_FAILED', {
        errors: [{ field: 'email', message: 'This address is blocked.' }],
      }),
    );
    const user = userEvent.setup();
    setup();

    await fill(user);
    await user.click(bookButton());

    const email = screen.getByRole('textbox', { name: 'Email' });
    await waitFor(() => {
      expect(email).toHaveFocus();
    });
    expect(email).toHaveAccessibleDescription('This address is blocked.');
    expect(screen.getByRole('alert')).toHaveTextContent('Check the highlighted fields');

    await user.type(email, 'm');
    expect(email).not.toHaveAccessibleDescription();
  });

  it('shows a sold out event without a form', () => {
    stubFetch();
    setup({ seatsLeft: 0, seatsTaken: event.capacity });

    expect(screen.getByText('This event is sold out.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Book seats' })).not.toBeInTheDocument();
  });

  it('ignores a late answer once the guest has left', async () => {
    const { promise: pending, resolve: answer } = Promise.withResolvers<Response>();
    const stub = vi.fn<typeof fetch>(() => pending);
    vi.stubGlobal('fetch', stub);
    const user = userEvent.setup();
    const { onbooked, unmount } = setup();

    await fill(user);
    await user.click(bookButton());
    unmount();
    answer(json(booking, 201));
    await pending;
    await tick();

    expect(stub.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    expect(onbooked).not.toHaveBeenCalled();
  });
});
