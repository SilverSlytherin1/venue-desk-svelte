<span>
  <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect width="32" height="32" rx="8" class="tile" />
    <path d="M9.5 10.5 16 22l6.5-11.5" class="mark" />
  </svg>
  Venue Desk
</span>

<style>
  span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  svg {
    width: 2rem;
    height: 2rem;
  }

  .tile {
    fill: var(--color-stage);
    stroke: var(--color-stage-border);
  }

  .mark {
    fill: none;
    stroke: var(--color-stage-accent);
    stroke-width: 3.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
