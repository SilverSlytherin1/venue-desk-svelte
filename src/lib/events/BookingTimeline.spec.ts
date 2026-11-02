import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';

import type { Booking, BookingMessage } from '#lib/api/models.ts';
import { bookingFixture } from '../../test-support.ts';
import BookingTimeline from './BookingTimeline.svelte';

const { messages } = bookingFixture as Booking;

function headings(): (string | null)[] {
  return screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
}

describe('BookingTimeline', () => {
  it('builds the steps from the messages the API scheduled, on the venue clock', () => {
    render(BookingTimeline, { messages });

    expect(headings()).toEqual([
      'Confirmation sent',
      'Reminder on Wed 13 Nov',
      'Feedback request on Fri 15 Nov',
    ]);
  });

  it('shows no reminder when the API scheduled none', () => {
    render(BookingTimeline, { messages: messages.filter(({ kind }) => kind !== 'REMINDER') });

    expect(headings()).toHaveLength(2);
    expect(screen.queryByText(/Reminder/)).not.toBeInTheDocument();
  });

  it('marks a cancelled message', () => {
    const cancelled: BookingMessage[] = [
      { kind: 'REMINDER', status: 'CANCELLED', scheduledFor: '2030-11-13T19:00:00Z', sentAt: null },
    ];
    render(BookingTimeline, { messages: cancelled });

    expect(screen.getByText('Cancelled with the booking.')).toBeInTheDocument();
  });
});
