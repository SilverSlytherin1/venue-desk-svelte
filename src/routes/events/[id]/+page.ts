import type { PageLoad } from './$types';
import { loadEvent } from './load-event.ts';

export const load: PageLoad = async ({ fetch, params }) => ({
  event: await loadEvent(fetch, params.id),
});
