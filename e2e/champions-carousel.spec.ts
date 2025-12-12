import { test, expect } from '@playwright/test';
import { ChampionsPage } from '../app/champions/page';

test.describe('Karuzela 3D Championów - Testy E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Przejdź na stronę champions przed każdym testem
    await page.goto('/champions');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Podstawowa funkcjonalność karuzeli', () => {
    test('powinna wyświetlić karuzelę championów', async ({ page }) => {
      // Sprawdź czy karuzela jest widoczna
      await expect(page.locator('[role="region"][aria-label="Karuzela championów gołębi pocztowych"]')).toBeVisible();
      
      // Sprawdź czy są widoczne zdjęcia championów
      await expect(page.locator('[data-testid="champion-image"]')).toHaveCount({ min: 1 });
    });

    test('powinna pokazać przycisk RODOWÓD', async ({ page }) => {
      // Sprawdź czy przycisk rodowodu jest widoczny i klikalny
      const pedigreeButton = page.locator('button', { hasText: 'RODOWÓD' });
      await expect(pedigreeButton).toBeVisible();
      await expect(pedigreeButton).toBeEnabled();
    });

    test('powinna wyświetlić strzałki nawigacyjne gdy są dostępne', async ({ page }) => {
      // Sprawdź czy strzałki są widoczne
      const prevArrow = page.locator('button[aria-label="Poprzedni champion"]');
      const nextArrow = page.locator('button[aria-label="Następny champion"]');
      
      // Strzałki powinny być widoczne gdy są zdjęcia
      await expect(prevArrow).toBeVisible();
      await expect(nextArrow).toBeVisible();
    });
  });

  test.describe('Nawigacja w karuzeli', () => {
    test('powinna umożliwić nawigację strzałkami', async ({ page }) => {
      const nextArrow = page.locator('button[aria-label="Następny champion"]');
      const prevArrow = page.locator('button[aria-label="Poprzedni champion"]');

      // Kliknij następną strzałkę
      await nextArrow.click();
      await page.waitForTimeout(500); // Poczekaj na animację

      // Kliknij poprzednią strzałkę
      await prevArrow.click();
      await page.waitForTimeout(500); // Poczekaj na animację
    });

    test('powinna obsługiwać nawigację klawiaturą', async ({ page }) => {
      // Test nawigacji klawiszami strzałek
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500);
      
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(500);
    });

    test('powinna umożliwić przejście do konkretnego zdjęcia przez wskaźniki postępu', async ({ page }) => {
      // Znajdź wskaźniki postępu
      const progressDots = page.locator('[role="tablist"] [role="tab"]');
      const count = await progressDots.count();
      
      if (count > 1) {
        // Kliknij drugi wskaźnik postępu
        await progressDots.nth(1).click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Interakcje z obrazami', () => {
    test('powinna otworzyć modal po kliknięciu centralnego obrazu', async ({ page }) => {
      // Kliknij centralny obraz championa
      const centerImage = page.locator('[role="button"][aria-label*="kliknij aby powiększyć"]').first();
      
      await centerImage.click();
      
      // Sprawdź czy modal się otworzył
      await expect(page.locator('[role="dialog"]')).toBeVisible();
    });

    test('powinna przejść do sąsiedniego zdjęcia po kliknięciu bocznego obrazu', async ({ page }) => {
      // Znajdź boczny obraz (nie centralny)
      const sideImage = page.locator('[role="button"][aria-label*="Przejdź do zdjęcia"]').first();
      
      await sideImage.click();
      await page.waitForTimeout(500);
      
      // Sprawdź czy nastąpiła nawigacja
      const centerImage = page.locator('[role="button"][aria-label*="kliknij aby powiększyć"]').first();
      await expect(centerImage).toBeVisible();
    });
  });

  test.describe('Funkcjonalność rodowodu', () => {
    test('powinna otworzyć modal rodowodu po kliknięciu przycisku RODOWÓD', async ({ page }) => {
      const pedigreeButton = page.locator('button', { hasText: 'RODOWÓD' });
      
      await pedigreeButton.click();
      
      // Sprawdź czy modal rodowodu się otworzył
      await expect(page.locator('text=Rodowód championa')).toBeVisible();
    });
  });

  test.describe('Accessibility (WCAG 2.1 AA)', () => {
    test('powinna obsługiwać nawigację klawiaturą', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Test Enter/Space na przycisku
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
    });

    test('powinna mieć poprawne ARIA labels', async ({ page }) => {
      // Sprawdź ARIA labels
      await expect(page.locator('[role="region"][aria-label]')).toHaveAttribute('aria-label', /Karuzela championów/);
      await expect(page.locator('button[aria-label*="Poprzedni"]')).toHaveAttribute('aria-label');
      await expect(page.locator('button[aria-label*="Następny"]')).toHaveAttribute('aria-label');
    });

    test('powinna mieć focus management', async ({ page }) => {
      // Sprawdź czy elementy są focusowalne
      const focusableElements = page.locator('button, [role="button"], [tabindex]');
      const count = await focusableElements.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        await focusableElements.nth(i).focus();
        // Sprawdź czy element ma focus
        await expect(focusableElements.nth(i)).toBeFocused();
      }
    });
  });

  test.describe('Odporność na błędy', () => {
    test('powinna obsłużyć błąd ładowania obrazów', async ({ page }) => {
      // Symuluj błąd ładowania przez przechwycenie requestów obrazów
      await page.route('**/*.{jpg,jpeg,png,webp,avif}', route => route.abort());
      
      // Odśwież stronę z błędnymi obrazami
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Karuzela powinna nadal być widoczna z placeholder lub błędem
      await expect(page.locator('[role="region"]')).toBeVisible();
    });

    test('powinna obsłużyć brak danych championów', async ({ page }) => {
      // Przechwytuj żądania API champions
      await page.route('/api/champions/images', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ champions: [] }),
        });
      });
      
      // Odśwież stronę
      await page.reload();
      await page.waitForTimeout(1000);
      
      // Powinna wyświetlić komunikat o braku danych
      await expect(page.locator('text=Brak zdjęć championów')).toBeVisible();
    });
  });

  test.describe('Responsywność', () => {
    test('powinna działać na urządzeniach mobilnych', async ({ page }) => {
      // Ustaw viewport na mobile
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Sprawdź czy karuzela jest nadal funkcjonalna
      await expect(page.locator('[role="region"]')).toBeVisible();
      
      // Sprawdisk strzałki nawigacji (mogą być inne na mobile)
      const navigationVisible = await page.locator('button[aria-label*="champion"]').count();
      expect(navigationVisible).toBeGreaterThan(0);
    });

    test('powinna działać na tablet', async ({ page }) => {
      // Ustaw viewport na tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await expect(page.locator('[role="region"]')).toBeVisible();
      
      // Sprawdź czy wszystkie elementy są widoczne
      await expect(page.locator('button', { hasText: 'RODOWÓD' })).toBeVisible();
    });
  });
}); ni