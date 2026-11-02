import { error } from '@sveltejs/kit';

import { type ApiResult, type Fetch } from '#lib/api/client.ts';
import { getEvent } from '#lib/api/events-api.ts';
import type { VenueEvent } from '#lib/api/models.ts';

/**
 * The API answers a read with NOT_FOUND for an unknown id and with VALIDATION_FAILED for an id
 * that is not a UUID. Both mean the address is wrong, so they go to the not-found page. Any other
 * failure stays in the result, for the page to offer "Try again".
 */
export async function loadEvent(fetchFn: Fetch, id: string): Promise<ApiResult<VenueEvent>> {
  const result = await getEvent(fetchFn, id);
  if (!result.ok && ['NOT_FOUND', 'VALIDATION_FAILED'].includes(result.problem.code)) {
    error(404, 'Event not found');
  }
  return result;
}
