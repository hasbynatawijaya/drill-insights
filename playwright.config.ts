import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	timeout: 90_000,
	use: { baseURL: 'http://localhost:4173' },
	webServer: { command: 'npm run build && npm run preview', port: 4173, timeout: 180_000 }
});
