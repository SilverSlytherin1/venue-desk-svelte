import { describe, expect, it, vi } from 'vitest';

import { problem } from '../../test-support.ts';
import { problemMessage, toApiProblem } from './api-problem.ts';
import { request } from './client.ts';

describe('request', () => {
  const answering = (response: Response) => vi.fn<typeof fetch>().mockResolvedValue(response);

  it('returns the body of a success', async () => {
    const fetchFn = answering(new Response('{"id":"1"}'));

    expect(await request(fetchFn, '/events/1')).toEqual({ ok: true, value: { id: '1' } });
    expect(fetchFn.mock.calls[0]?.[0]).toBe('/api/v1/events/1');
  });

  it('parses a problem document', async () => {
    const result = await request(
      answering(problem(409, 'EVENT_SOLD_OUT', { seatsLeft: 2, detail: 'Only 2 seats left.' })),
      '/events/1/bookings',
    );

    expect(result).toEqual({
      ok: false,
      problem: {
        code: 'EVENT_SOLD_OUT',
        status: 409,
        title: 'EVENT_SOLD_OUT',
        detail: 'Only 2 seats left.',
        seatsLeft: 2,
      },
    });
  });

  it('turns a failed fetch into NETWORK_ERROR', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline'));

    expect(await request(fetchFn, '/events')).toMatchObject({
      ok: false,
      problem: { code: 'NETWORK_ERROR', status: 0 },
    });
  });

  it('falls back to the status for an error page', async () => {
    const page = new Response('<h1>Not here</h1>', { status: 404 });

    expect(await request(answering(page), '/events/1')).toMatchObject({
      ok: false,
      problem: { code: 'NOT_FOUND', status: 404 },
    });
  });

  it('does not call an unreadable success a success', async () => {
    expect(await request(answering(new Response('<html>')), '/events')).toMatchObject({
      ok: false,
      problem: { code: 'INTERNAL_ERROR' },
    });
  });
});

describe('toApiProblem', () => {
  it('counts a gateway error as no answer from the API', () => {
    expect(toApiProblem(503, null).code).toBe('NETWORK_ERROR');
  });

  it('keeps only well formed field errors', () => {
    const body = {
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'seats', message: 'No' }, { a: 1 }],
    };

    expect(toApiProblem(422, body)).toMatchObject({
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'seats', message: 'No' }],
    });
  });

  it('treats an unknown code as an internal error', () => {
    expect(toApiProblem(500, { code: 'SOMETHING_NEW' }).code).toBe('INTERNAL_ERROR');
  });

  it('prefers the detail of the API over its title', () => {
    expect(problemMessage(toApiProblem(404, { title: 'Gone', detail: 'No such event.' }))).toBe(
      'No such event.',
    );
  });
});
