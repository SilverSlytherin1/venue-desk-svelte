import type { Booking } from '#lib/api/models.ts';

declare global {
  namespace App {
    interface PageState {
      /** The booking the API returned, kept in the history entry of the confirmation page. */
      booking?: Booking;
    }
  }
}

export {};
