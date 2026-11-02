import { type ApiProblem, toApiProblem } from './api-problem.ts';

const API_BASE_URL = '/api/v1';

/** A call either has its value or one typed problem. It never throws. */
export type ApiResult<T> = { ok: true; value: T } | { ok: false; problem: ApiProblem };

/** A `load` function passes its own `fetch`; a component passes the global one. */
export type Fetch = typeof fetch;

/**
 * The only place that knows about HTTP failures. Everything downstream receives an `ApiProblem`
 * and switches on its `code`. Successful bodies are trusted to match the contract types.
 */
export async function request<T>(
  fetchFn: Fetch,
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  let response: Response;
  try {
    response = await fetchFn(`${API_BASE_URL}${path}`, init);
  } catch {
    return { ok: false, problem: toApiProblem(0, null) };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // An HTML error page from a proxy, or a success that cannot be read: the status decides below.
  }

  return response.ok && body !== null
    ? { ok: true, value: body as T }
    : { ok: false, problem: toApiProblem(response.ok ? 500 : response.status, body) };
}
