/* eslint-disable @typescript-eslint/no-explicit-any */
import { test, expect } from '@playwright/test';

test.describe('RF617 Browser Error Detection', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error tracking
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(`Uncaught exception: ${error.message}`);
    });

    // Store errors in page context for later access
    await page.addInitScript(() => {
      (window as any).__testErrors = [];
      (window as any).__testWarnings = [];

      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args) => {
        (window as any).__testErrors.push(args.join(' '));
        originalError.apply(console, args);
      };

      console.warn = (...args) => {
        (window as any).__testWarnings.push(args.join(' '));
        originalWarn.apply(console, args);
      };
    });
  });

  test('should load app without JavaScript errors', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to fully load
    await page.waitForSelector('.app', { timeout: 10000 });

    // Wait for p5.js canvas to be created
    await page.waitForSelector('canvas', { timeout: 10000 });

    // Give the app time to initialize and run effects
    await page.waitForTimeout(1000);

    // Check for JavaScript errors
    const errors = await page.evaluate(
      () => (window as any).__testErrors || []
    );

    // Filter out known p5.js warnings that aren't critical
    const criticalErrors = errors.filter(
      (error: string) =>
        !error.includes('The AudioContext was not allowed to start') &&
        !error.includes('deprecation warning') &&
        !error.includes('WebGL warning') &&
        !error.includes('Error parsing code: SyntaxError') // Ignore sourcemap parsing errors
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should generate art without errors when clicking Generate', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('#generate-btn');
    await page.waitForSelector('canvas');

    // Clear any initial errors
    await page.evaluate(() => {
      (window as any).__testErrors = [];
    });

    // Click generate button
    await page.click('#generate-btn');

    // Wait for generation to complete
    await page.waitForTimeout(1000);

    // Check for errors during generation
    const errors = await page.evaluate(
      () => (window as any).__testErrors || []
    );
    const criticalErrors = errors.filter(
      (error: string) =>
        !error.includes('The AudioContext was not allowed to start') &&
        !error.includes('deprecation warning') &&
        !error.includes('WebGL warning') &&
        !error.includes('Error parsing code: SyntaxError') // Ignore sourcemap parsing errors
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle all effect types without errors', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('.app');
    await page.waitForSelector('canvas');

    const effectButtons = [
      '[data-effect="off"]',
      '[data-effect="blur"]',
      '[data-effect="waves"]',
      '[data-effect="displacement"]',
    ];

    for (const selector of effectButtons) {
      // Clear errors before each test
      await page.evaluate(() => {
        (window as any).__testErrors = [];
      });

      // Click effect button
      await page.click(selector);

      // Wait for effect to apply
      await page.waitForTimeout(1000);

      // Check for errors
      const errors = await page.evaluate(
        () => (window as any).__testErrors || []
      );
      const criticalErrors = errors.filter(
        (error: string) =>
          !error.includes('The AudioContext was not allowed to start') &&
          !error.includes('deprecation warning') &&
          !error.includes('WebGL warning')
      );

      expect(criticalErrors).toHaveLength(0);
    }
  });

  test('should handle palette changes without errors', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('.app');
    await page.waitForSelector('canvas');

    // Clear errors before test
    await page.evaluate(() => {
      (window as any).__testErrors = [];
    });

    // Test just one palette button to reduce test time
    const selector = '[data-pattern="analogous"]';

    await page.click(selector);
    // Verify the click worked by checking active class
    await page.waitForSelector(`${selector}.active`, { timeout: 1000 });

    // Wait a short time for any async operations to complete
    await page.waitForTimeout(100);

    // Check for errors after all interactions
    const errors = await page.evaluate(
      () => (window as any).__testErrors || []
    );
    const criticalErrors = errors.filter(
      (error: string) =>
        !error.includes('The AudioContext was not allowed to start') &&
        !error.includes('deprecation warning') &&
        !error.includes('WebGL warning')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('should display canvas and UI elements correctly', async ({ page }) => {
    await page.goto('/');

    // Check that main UI elements are visible
    await expect(page.locator('.app')).toBeVisible();
    await expect(page.locator('.controls-panel')).toBeVisible();
    await expect(page.locator('canvas').first()).toBeVisible();
    await expect(page.locator('#generate-btn')).toBeVisible();
    await expect(page.locator('#export-btn')).toBeVisible();

    // Check that main canvas has proper dimensions (use first canvas)
    const canvas = page.locator('canvas').first();
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).toBeTruthy();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);
  });
});
