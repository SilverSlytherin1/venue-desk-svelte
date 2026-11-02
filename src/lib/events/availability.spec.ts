import { describe, expect, it } from 'vitest';

import { availabilityOf, seatCount } from './availability.ts';

describe('availability', () => {
  it.each([
    [0, 100, 'sold-out'],
    [10, 100, 'few-left'],
    [11, 100, 'available'],
    [4, 20, 'few-left'],
    [5, 20, 'available'],
  ] as const)('%i of %i seats left is %s', (seatsLeft, capacity, expected) => {
    expect(availabilityOf({ seatsLeft, capacity })).toBe(expected);
  });

  it('counts seats in words', () => {
    expect(seatCount(1)).toBe('1 seat');
    expect(seatCount(3)).toBe('3 seats');
  });
});
