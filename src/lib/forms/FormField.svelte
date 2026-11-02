<script lang="ts" module>
  /** What the control inside a field spreads onto itself, to be tied to the texts around it. */
  export interface ControlAttributes {
    id: string;
    'aria-invalid': 'true' | undefined;
    'aria-describedby': string | undefined;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    hint?: string;
    optional?: boolean;
    error: string | null;
    control: Snippet<[ControlAttributes]>;
  }

  let { label, hint, optional = false, error, control }: Props = $props();

  const id = $props.id();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = $derived(
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined,
  );
</script>

<div>
  <label for={id}>
    {label}
    {#if optional}<span class="muted">(optional)</span>{/if}
  </label>
  {#if hint}
    <p id={hintId} class="muted">{hint}</p>
  {/if}
  {@render control({
    id,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
  })}
  {#if error}
    <p id={errorId} class="error">{error}</p>
  {/if}
</div>

<style>
  div {
    display: grid;
    gap: var(--space-1);
  }

  label {
    font-weight: var(--weight-medium);
  }

  p {
    font-size: var(--text-sm);
  }

  label .muted {
    font-weight: var(--weight-regular);
  }

  .error {
    color: var(--color-danger);
    font-weight: var(--weight-medium);
  }
</style>
