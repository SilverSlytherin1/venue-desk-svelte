import { type Mock, vi } from 'vitest';

export { default as bookingFixture } from '../cypress/fixtures/booking.json';
export { default as eventFixture } from '../cypress/fixtures/event.json';
export { default as eventsFixture } from '../cypress/fixtures/events.json';
export { default as invitationFixture } from '../cypress/fixtures/feedback-invitation.json';

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

export function problem(status: number, code: string, fields: object = {}): Response {
  return json({ title: code, status, code, ...fields }, status);
}

/** Replaces only the network. Each call takes the next answer, and an extra call is an error. */
export function stubFetch(...answers: (Response | Error)[]): Mock<typeof fetch> {
  const stub = vi.fn<typeof fetch>();
  for (const answer of answers) {
    stub.mockImplementationOnce(() =>
      answer instanceof Error ? Promise.reject(answer) : Promise.resolve(answer),
    );
  }
  stub.mockImplementation((input) => Promise.reject(new Error(`No stub for ${input as string}`)));
  vi.stubGlobal('fetch', stub);
  return stub;
}

/** What one recorded call sent: its parsed body and its headers. */
export function sentBy(stub: Mock<typeof fetch>, call: number) {
  const init = stub.mock.calls[call]?.[1];
  return {
    body: JSON.parse(init?.body as string) as unknown,
    headers: init?.headers as Record<string, string>,
  };
}
