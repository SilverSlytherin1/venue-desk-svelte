import { type ApiResult, type Fetch, request } from './client.ts';
import type { Booking, BookingRequest, Page, VenueEvent } from './models.ts';

/** Upcoming events, soonest first. */
export function listUpcoming(
  fetchFn: Fetch,
  page: number,
  pageSize: number,
): Promise<ApiResult<Page<VenueEvent>>> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    when: 'upcoming',
  });
  return request(fetchFn, `/events?${query.toString()}`);
}

export function getEvent(fetchFn: Fetch, id: string): Promise<ApiResult<VenueEvent>> {
  return request(fetchFn, `/events/${encodeURIComponent(id)}`);
}

/**
 * The API treats a repeated key with the same payload as a replay and returns the original
 * booking, so the caller decides what counts as a new submission by choosing the key.
 */
export function bookSeats(
  fetchFn: Fetch,
  eventId: string,
  details: BookingRequest,
  idempotencyKey: string,
  signal: AbortSignal,
): Promise<ApiResult<Booking>> {
  return request(fetchFn, `/events/${encodeURIComponent(eventId)}/bookings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey },
    body: JSON.stringify(details),
    signal,
  });
}
