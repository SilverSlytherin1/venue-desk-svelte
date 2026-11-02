import { loadEvent } from '../load-event.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => ({
  eventId: params.id,
  event: await loadEvent(fetch, params.id),
});
