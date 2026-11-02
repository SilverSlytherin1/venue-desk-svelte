import type { FieldError } from '#lib/api/api-problem.ts';

/** Not a full address check: the API has the last word. This catches typing slips. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requiredError(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}

export function emailError(value: string): string | null {
  return (
    requiredError(value, 'Email') ??
    (EMAIL_SHAPE.test(value.trim()) ? null : 'Enter an email address like name@example.com.')
  );
}

export function wholeNumberError(
  value: number | null | undefined,
  label: string,
  min: number,
  max: number,
): string | null {
  if (value === null || value === undefined) return `${label} is required.`;
  if (!Number.isInteger(value)) return `${label} must be a whole number.`;
  if (value < min) return `${label} must be ${min} or more.`;
  return value > max ? `${label} must be ${max} or less.` : null;
}

/**
 * Summary for a form the API rejected. An error for a field that is on screen is shown next to
 * that field; an error for anything else has nowhere to go, so it is spelled out here.
 */
export function rejectionSummary(errors: readonly FieldError[], fields: readonly string[]): string {
  const elsewhere = errors.filter(({ field }) => !fields.includes(field));
  if (elsewhere.length > 0) return elsewhere.map(({ message }) => message).join(' ');

  return errors.length > 0
    ? 'Check the highlighted fields and try again.'
    : 'The server did not accept these details. Try again.';
}

/** Takes the user to the first field that needs attention, once its state has reached the DOM. */
export function focusFirstInvalid(form: HTMLFormElement | undefined): void {
  form?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid]')?.focus();
}
