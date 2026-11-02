import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FeedbackInvitation } from '#lib/api/models.ts';
import { invitationFixture, json, problem, sentBy, stubFetch } from '../../test-support.ts';
import FeedbackPanel from './FeedbackPanel.svelte';

const invitation = invitationFixture as FeedbackInvitation;
const token = '5f0c2a9e-8d1b-4c3e-9a7f-2b6d4e8c1a35';

function setup(overrides: Partial<FeedbackInvitation> = {}) {
  const onstale = vi.fn<() => void>();
  render(FeedbackPanel, { token, invitation: { ...invitation, ...overrides }, onstale });
  return { onstale };
}

const send = () => screen.getByRole('button', { name: 'Send feedback' });

describe('FeedbackPanel', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('greets the guest with the date on the venue clock', () => {
    stubFetch();
    setup();

    expect(screen.getByText(/Hi Elsa/)).toHaveTextContent('Tuesday 1 October');
  });

  it('offers the rating as a native radio group that needs a choice', async () => {
    const stub = stubFetch();
    const user = userEvent.setup();
    setup();

    const group = screen.getByRole('group', { name: 'Your rating' });
    expect(screen.getAllByRole('radio')).toHaveLength(5);

    await user.click(send());

    await waitFor(() => {
      expect(screen.getByRole('radio', { name: '1 star' })).toHaveFocus();
    });
    expect(group).toHaveAccessibleDescription('Choose a rating from 1 to 5 stars.');
    expect(stub).not.toHaveBeenCalled();
  });

  it('moves through the stars with the arrow keys', async () => {
    stubFetch();
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('radio', { name: '2 stars' }));
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked();
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('sends the rating with a trimmed comment and thanks the guest', async () => {
    const stub = stubFetch(json({ rating: 4, comment: 'Great', createdAt: '' }, 201));
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('radio', { name: '4 stars' }));
    await user.type(screen.getByRole('textbox', { name: /Comment/ }), '  Great  ');
    expect(screen.getByText('9 of 1000 characters')).toBeInTheDocument();
    await user.click(send());

    expect(await screen.findByRole('status')).toHaveTextContent('Thank you, Elsa');
    expect(screen.getByRole('img', { name: '4 out of 5' })).toBeInTheDocument();
    expect(sentBy(stub, 0).body).toEqual({ rating: 4, comment: 'Great' });
  });

  it('leaves out an empty comment', async () => {
    const stub = stubFetch(json({ rating: 5, comment: null, createdAt: '' }, 201));
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('radio', { name: '5 stars' }));
    await user.click(send());

    await screen.findByRole('status');
    expect(sentBy(stub, 0).body).toEqual({ rating: 5 });
  });

  it('asks for a reload when the API already has an answer', async () => {
    stubFetch(problem(409, 'FEEDBACK_ALREADY_SUBMITTED'));
    const user = userEvent.setup();
    const { onstale } = setup();

    await user.click(screen.getByRole('radio', { name: '3 stars' }));
    await user.click(send());

    await waitFor(() => {
      expect(onstale).toHaveBeenCalledOnce();
    });
  });

  it('shows the earlier rating when the invitation is already answered', () => {
    stubFetch();
    setup({ submitted: true, rating: 5 });

    expect(screen.getByRole('status')).toHaveTextContent('You already rated this evening');
    expect(screen.getByRole('img', { name: '5 out of 5' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('explains a closed link and a failed send in an alert', async () => {
    stubFetch(problem(409, 'FEEDBACK_NOT_OPEN'), new TypeError('offline'));
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('radio', { name: '3 stars' }));
    await user.click(send());
    expect(await screen.findByRole('alert')).toHaveTextContent('not open for this booking');

    await user.click(send());
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('could not be reached');
    });
  });
});
