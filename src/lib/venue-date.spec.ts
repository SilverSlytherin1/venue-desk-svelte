import { describe, expect, it } from 'vitest';

import { calendarLeaf, dateAndTime, longDate, shortDate } from './venue-date.ts';

describe('venue dates', () => {
  it('shows the wall clock of the venue, not of the browser', () => {
    // Europe/Rome is UTC+1 in winter.
    expect(dateAndTime('2030-11-14T19:00:00.000Z')).toBe('Thu 14 Nov 2030, 20:00');
  });

  it('follows daylight saving time', () => {
    // And UTC+2 in summer: a fixed offset would be an hour out for half of the year.
    expect(dateAndTime('2030-07-14T19:00:00.000Z')).toBe('Sun 14 Jul 2030, 21:00');
  });

  it('changes day with the venue', () => {
    expect(shortDate('2030-11-14T23:30:00.000Z')).toBe('Fri 15 Nov');
  });

  it('writes a date out in full', () => {
    expect(longDate('2030-11-14T19:00:00.000Z')).toBe('Thursday 14 November');
  });

  it('splits a date for a calendar leaf', () => {
    expect(calendarLeaf('2030-11-14T19:00:00.000Z')).toEqual({
      weekday: 'Thu',
      day: '14',
      month: 'Nov',
    });
  });
});
