<script lang="ts">
  import { type ApiProblem, problemMessage } from '#lib/api/api-problem.ts';

  interface Props {
    heading: string;
    problem: ApiProblem;
    onretry: () => void;
  }

  let { heading, problem, onretry }: Props = $props();
</script>

<div role="alert" data-tone="danger">
  <h2>{heading}</h2>
  <p>{problemMessage(problem)}</p>
  <button type="button" class="button" onclick={onretry}>Try again</button>
</div>

<style>
  div {
    display: grid;
    justify-items: start;
    gap: var(--space-3);
    padding: var(--space-6);
    border: 1px solid color-mix(in srgb, var(--tone-fg) 25%, transparent);
    border-inline-start: var(--space-1) solid var(--tone-fg);
    border-radius: var(--radius-lg);
    background: var(--tone-bg);
    color: var(--tone-fg);
  }

  h2 {
    color: var(--tone-fg);
    font-size: var(--text-lg);
  }
</style>
