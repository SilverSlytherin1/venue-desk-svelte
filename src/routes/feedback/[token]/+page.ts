import { getInvitation } from '#lib/api/feedback-api.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => ({
  token: params.token,
  invitation: await getInvitation(fetch, params.token),
});
