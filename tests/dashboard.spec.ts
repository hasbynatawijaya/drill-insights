import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('filters update the numbers and survive a reload', async ({ page }) => {
	await page.goto('/');
	const clickRate = page.getByTestId('click-rate');
	await expect(clickRate).toBeVisible({ timeout: 60_000 });
	const unfiltered = await clickRate.textContent();

	await page.getByLabel('Department').selectOption('Support');
	await expect(page).toHaveURL(/department=Support/);
	await expect(clickRate).not.toHaveText(unfiltered!);
	const filtered = await clickRate.textContent();

	await page.reload();
	await expect(page.getByTestId('click-rate')).toHaveText(filtered!, { timeout: 60_000 });
	await expect(page.getByLabel('Department')).toHaveValue('Support');
});

test('the table loads rows far down the list', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('click-rate')).toBeVisible({ timeout: 60_000 });

	const scroller = page.locator('.scroller');
	await expect(scroller.getByRole('row').first()).toContainText('#', { timeout: 30_000 });
	await scroller.evaluate((node) => (node.scrollTop = node.scrollHeight));
	await expect(scroller.getByRole('row').last()).toContainText('#25000', { timeout: 30_000 });
});

test('has no detectable accessibility violations', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByTestId('click-rate')).toBeVisible({ timeout: 60_000 });
	await expect(page.locator('.scroller').getByRole('row').first()).toContainText('#', {
		timeout: 30_000
	});

	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});
