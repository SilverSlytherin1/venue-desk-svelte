import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

import type { ApiProblem } from '#lib/api/api-problem.ts';
import type { ApiResult } from '#lib/api/client.ts';
import { getInvitation } from '#lib/api/feedback-api.ts';
import type { Page, VenueEvent } from '#lib/api/models.ts';
import { eventsFixture, invitationFixture, json, problem } from '../test-support.ts';
import HomePage from './+page.svelte';
import { load as loadHome } from './+page.ts';
import { loadEvent } from './events/[id]/load-event.ts';
import FeedbackPage from './feedback/[token]/+page.svelte';

const answering = (response: Response) => vi.fn<typeof fetch>().mockResolvedValue(response);

async function homeData(response: Response) {
  const event = { fetch: answering(response) } as unknown as Parameters<typeof loadHome>[0];
  return (await loadHome(event)) as { events: ApiResult<Page<VenueEvent>> };
}

describe('home page', () => {
  it('lists the upcoming events with their seats left', async () => {
    render(HomePage, { data: await homeData(json(eventsFixture)), params: {} });

    const list = screen.getByRole('list', { name: 'Upcoming events' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(eventsFixture.items.length);
    expect(within(list).getByText('82 seats left of 120')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Mic Poetry' })).toBeInTheDocument();
    expect(screen.getByText('Sold out')).toBeInTheDocument();
  });

  it('offers to try again when the list cannot be loaded', async () => {
    const data = await homeData(new Response('', { status: 503 }));
    render(HomePage, { data, params: {} });

    expect(screen.getByRole('alert')).toHaveTextContent('The events could not be loaded');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('says so when nothing is scheduled', async () => {
    const data = await homeData(json({ items: [], page: 1, pageSize: 12, total: 0 }));
    render(HomePage, { data, params: {} });

    expect(screen.getByRole('heading', { name: 'No upcoming events' })).toBeInTheDocument();
  });
});

describe('loading an event', () => {
  it('sends a wrong address to the not-found page', async () => {
    await expect(loadEvent(answering(problem(404, 'NOT_FOUND')), 'nope')).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      loadEvent(answering(problem(400, 'VALIDATION_FAILED')), 'nope'),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('keeps any other failure in the result, for "Try again"', async () => {
    const result = await loadEvent(answering(new Response('', { status: 503 })), 'id');

    expect(result).toMatchObject({ ok: false, problem: { code: 'NETWORK_ERROR' } });
  });
});

describe('feedback page', () => {
  const token = 'link-token';

  async function open(response: Response) {
    const invitation = await getInvitation(answering(response), token);
    render(FeedbackPage, { data: { token, invitation }, params: { token } });
  }

  it('names the evening in the heading', async () => {
    await open(json(invitationFixture));

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'How was Blues at the Bar?',
    );
  });

  it.each([
    ['FEEDBACK_NOT_FOUND', 404, 'This feedback link does not work'],
    ['FEEDBACK_NOT_OPEN', 409, 'Feedback is not open yet'],
  ])('explains %s with no form and no retry', async (code, status, message) => {
    await open(problem(status, code));

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('offers to try again when the answer is unknown', () => {
    const offline: ApiProblem = { code: 'NETWORK_ERROR', status: 0, title: 'Offline' };
    render(FeedbackPage, {
      data: { token, invitation: { ok: false, problem: offline } },
      params: { token },
    });

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
