import { type ApiResult, type Fetch, request } from './client.ts';
import type { FeedbackInvitation, FeedbackReceipt, FeedbackRequest } from './models.ts';

/** The token from the guest's link is the only credential. */
export function getInvitation(
  fetchFn: Fetch,
  token: string,
): Promise<ApiResult<FeedbackInvitation>> {
  return request(fetchFn, `/feedback/${encodeURIComponent(token)}`);
}

/** The API trims the comment and stores an empty one as null. */
export function submitFeedback(
  fetchFn: Fetch,
  token: string,
  feedback: FeedbackRequest,
): Promise<ApiResult<FeedbackReceipt>> {
  return request(fetchFn, `/feedback/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(feedback),
  });
}
