/** Sets the theme the app sees, so a screenshot does not depend on the machine it was taken on. */
export function useTheme(theme: 'light' | 'dark'): void {
  cy.wrap(
    Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia',
      params: { features: [{ name: 'prefers-color-scheme', value: theme }] },
    }),
    { log: false },
  );
}
