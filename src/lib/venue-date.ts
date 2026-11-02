/**
 * The IANA time zone of the venue. Every date and time in the app is shown on the venue's clock,
 * whatever the browser's zone, so the screens agree with the messages the API writes (its
 * `VENUE_TIME_ZONE`).
 */
export const VENUE_TIME_ZONE = 'Europe/Rome';

function formatter(style: 'long' | 'short'): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: VENUE_TIME_ZONE,
    weekday: style,
    month: style,
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
}

const FORMATTERS = { long: formatter('long'), short: formatter('short') };

function partsOf(value: string, style: 'long' | 'short'): Record<string, string> {
  const parts = FORMATTERS[style].formatToParts(new Date(value));
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** `Thu 14 Nov 2030, 20:00` */
export function dateAndTime(value: string): string {
  const { weekday, day, month, year, hour, minute } = partsOf(value, 'short');
  return `${weekday ?? ''} ${day ?? ''} ${month ?? ''} ${year ?? ''}, ${hour ?? ''}:${minute ?? ''}`;
}

/** `Thu 14 Nov` */
export function shortDate(value: string): string {
  const { weekday = '', day = '', month = '' } = partsOf(value, 'short');
  return `${weekday} ${day} ${month}`;
}

/** `Thursday 14 November` */
export function longDate(value: string): string {
  const { weekday = '', day = '', month = '' } = partsOf(value, 'long');
  return `${weekday} ${day} ${month}`;
}

/** The fields of a calendar leaf: `{ weekday: 'Thu', day: '14', month: 'Nov' }`. */
export function calendarLeaf(value: string): { weekday: string; day: string; month: string } {
  const { weekday = '', day = '', month = '' } = partsOf(value, 'short');
  return { weekday, day, month };
}
