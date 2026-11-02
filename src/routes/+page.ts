import { listUpcoming } from '#lib/api/events-api.ts';
import type { PageLoad } from './$types';

/** The programme fits one screen: the home page shows the next dozen events. */
const PAGE_SIZE = 12;

export const load: PageLoad = async ({ fetch }) => ({
  events: await listUpcoming(fetch, 1, PAGE_SIZE),
});
