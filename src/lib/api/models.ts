// Wire types of the Venue Desk API contract, guest side. Dates are ISO 8601 UTC strings, ids are
// UUIDs. They follow the models of venue-desk-web.

// The contract calls this `Event`. It is renamed here so it cannot shadow the DOM `Event`.
export interface VenueEvent {
  id: string;
  title: string;
  description: string;
  venue: string;
  startsAt: string;
  capacity: number;
  seatsTaken: number;
  seatsLeft: number;
}

export interface BookingRequest {
  name: string;
  email: string;
  seats: number;
}

export type MessageKind = 'CONFIRMATION' | 'REMINDER' | 'FEEDBACK_REQUEST';
export type MessageStatus = 'SCHEDULED' | 'SENT' | 'CANCELLED';

/** A message of a booking as the booking itself carries it: when, not what. */
export interface BookingMessage {
  kind: MessageKind;
  status: MessageStatus;
  scheduledFor: string;
  sentAt: string | null;
}

export interface Booking extends BookingRequest {
  id: string;
  reference: string;
  eventId: string;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
  /** Ordered by `scheduledFor`. */
  messages: BookingMessage[];
  /** The guest's rating from 1 to 5, or null while there is no feedback. */
  rating: number | null;
}

/** What the guest's feedback link opens: enough to greet them, nothing more. */
export interface FeedbackInvitation {
  eventTitle: string;
  eventStartsAt: string;
  guestFirstName: string;
  submitted: boolean;
  rating: number | null;
}

export interface FeedbackRequest {
  rating: number;
  comment?: string;
}

export interface FeedbackReceipt {
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
