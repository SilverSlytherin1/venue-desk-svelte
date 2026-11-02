import { copyFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Override with CYPRESS_BASE_URL to run against another port or a deployed build.
    baseUrl: 'http://localhost:5173',
    video: false,
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents(on) {
      // Larger than any viewport a test sets, so a screenshot is not scaled or cropped.
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'electron') {
          launchOptions.preferences['width'] = 1400;
          launchOptions.preferences['height'] = 1200;
        }
        return launchOptions;
      });
      // A test that names its screenshot `readme-<name>` supplies a picture for the README.
      on('after:screenshot', ({ path }) => {
        const name = basename(path);
        if (name.startsWith('readme-')) {
          copyFileSync(path, join('docs/screenshots', name.slice('readme-'.length)));
        }
        return {};
      });
    },
  },
});
