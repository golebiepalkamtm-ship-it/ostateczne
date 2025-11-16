import { test, expect } from '@playwright/test';

test('Unauthenticated user is redirected from /profile to /auth/register', async ({ page }) => {
  const resp = await page.goto('/profile');
  // Next.js middleware should redirect unauthenticated users
  expect(resp?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/auth\/register/);
});

test('Unauthenticated user is redirected from /auctions/create to /auth/register', async ({
  page,
}) => {
  const resp = await page.goto('/auctions/create');
  expect(resp?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/auth\/register/);
});

// Testy dla Poziomu 2: Użytkownik z Poziomu 2 MOŻE wejść w Panel Użytkownika, ale NIE MOŻE dodać zdjęcia
test('Level 2 user can access /profile/edit but cannot upload images', async ({ page }) => {
  // Mock authenticated user with Level 2 role
  await page.addScriptTag({
    content: `
      window.localStorage.setItem('firebase-auth-token', 'mock-level2-token');
      window.sessionStorage.setItem('user-role', 'USER_EMAIL_VERIFIED');
    `,
  });

  // Navigate to profile edit page
  await page.goto('/profile/edit');
  await expect(page).toHaveURL(/\/profile\/edit/);

  // Should be able to see profile form
  await expect(page.locator('input[name="firstName"]')).toBeVisible();

  // Should NOT be able to upload images (Level 3 feature)
  const uploadButton = page.locator('input[type="file"]').first();
  await expect(uploadButton).not.toBeVisible();
});

// Testy dla Poziomu 3: Użytkownik z Poziomu 3 MOŻE brać udział w aukcjach i dodawać treści
test('Level 3 user can access auctions and upload content', async ({ page }) => {
  // Mock authenticated user with Level 3 role
  await page.addScriptTag({
    content: `
      window.localStorage.setItem('firebase-auth-token', 'mock-level3-token');
      window.sessionStorage.setItem('user-role', 'USER_FULL_VERIFIED');
    `,
  });

  // Navigate to auctions create page
  await page.goto('/auctions/create');
  await expect(page).toHaveURL(/\/auctions\/create/);

  // Should be able to see auction creation form
  await expect(page.locator('input[name="title"]')).toBeVisible();

  // Navigate to profile edit page
  await page.goto('/profile/edit');

  // Should be able to upload images (Level 3 feature)
  const uploadButton = page.locator('input[type="file"]').first();
  await expect(uploadButton).toBeVisible();
});
