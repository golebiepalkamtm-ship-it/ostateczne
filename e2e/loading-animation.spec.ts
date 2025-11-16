import { test, expect } from '@playwright/test';

test('Loading animation and transition', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Wait for video to load
  await page.waitForSelector('video');

  // Check if white background is visible initially
  const whiteBackground = page.locator('div.absolute.inset-0.bg-white');
  await expect(whiteBackground).toBeVisible();

  // Check if video is playing
  const video = page.locator('video');
  await expect(video).toBeVisible();

  // Wait for fade-out to start (4 seconds)
  await page.waitForTimeout(4000);

  // Check if white background starts fading out
  await expect(whiteBackground).toHaveClass(/opacity-0/);

  // Wait for fade-out to complete
  await page.waitForTimeout(4000);

  // Check if main content is visible
  const mainContent = page.locator('main');
  await expect(mainContent).toBeVisible();
});