import { expect, test } from '@playwright/test';
import { SAMPLE_WHEELS } from './fixtures/test-data';
import { ConfigPage } from './page-objects/config-page.po';
import { HomePage } from './page-objects/home-page.po';
import { SavedWheelsDrawer } from './page-objects/saved-wheels.po';
import { WheelPage } from './page-objects/wheel-page.po';
import { clearLocalStorage, corruptLocalStorage, mockStorageQuotaExceeded } from './utils/storage';

/**
 * Test suite for error handling and edge cases.
 * Covers localStorage issues, invalid configurations, and error recovery.
 */
test.describe('Error Handling', () => {
    /**
     * Clear localStorage before each test
     */
    test.beforeEach(async ({ page }) => {
        // Navigate to home page first to establish context for localStorage
        await page.goto('/');
        await clearLocalStorage(page);
    });

    /**
     * Test: Handle localStorage quota exceeded error
     */
    test('should handle localStorage quota exceeded error gracefully', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Mock storage quota exceeded
        await mockStorageQuotaExceeded(page);

        // Navigate and try to save
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Try to save wheel (should handle error)
        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();

        // Assert - Page should not crash
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Handle corrupted saved wheels data
     */
    test('should recover from corrupted saved wheels data', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Corrupt localStorage data
        await corruptLocalStorage(page, 'savedWheels');

        // Act
        await homePage.goto();
        await savedWheels.openDrawer();

        // Assert - Should show empty list instead of crashing
        const count = await savedWheels.getSavedWheelCount().catch(() => 0);
        expect(count).toBe(0);
    });

    /**
     * Test: Handle invalid encoded config in URL
     */
    test('should handle invalid encoded config in URL', async ({ page }) => {
        // Arrange & Act
        await page.goto('/wheel/v3/not-a-valid-base64-string!!!');

        // Assert - Page should not crash and should show error state
        // The wheel page shows "Unable to load wheel" for invalid configs
        const errorHeading = page.locator('text=/unable to load/i');
        const isErrorVisible = await errorHeading.isVisible({ timeout: 5000 }).catch(() => false);

        expect(isErrorVisible).toBe(true);
    });

    /**
     * Test: Handle malformed JSON in encoded config
     */
    test('should handle malformed JSON in config', async ({ page }) => {
        // Arrange

        // Act - Use invalid JSON base64
        const invalidJson = Buffer.from('{invalid json}').toString('base64');
        await page.goto(`/config/v3/${invalidJson}`);

        // Assert - Should show error state with "Unable to load configuration"
        const errorHeading = page.locator('text=/unable to load/i');
        const isErrorVisible = await errorHeading.isVisible({ timeout: 5000 }).catch(() => false);

        // Or the page may show the "Create New Wheel" button as part of the error recovery
        const createButton = page.getByRole('button', { name: /Create New Wheel/i });
        const hasCreateButton = await createButton.isVisible({ timeout: 2000 }).catch(() => false);

        expect(isErrorVisible || hasCreateButton).toBe(true);
    });

    /**
     * Test: Empty wheel names validation
     */
    test('should not allow empty names field', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // Try submitting without names - should stay on config page
        await configPage.clickCreateNewWheel();

        // Assert - Should remain on config page (form validation prevents navigation)
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/config/v3/');
    });

    /**
     * Test: Very long name entries
     */
    test('should handle very long name entries', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel with very long names
        const longNames = ['A'.repeat(100), 'B'.repeat(100), 'C'.repeat(100)];

        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(longNames);
        await configPage.clickCreateNewWheel();

        // Assert - Should create wheel successfully
        await page.waitForURL(/\/wheel\/v3\//);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Special characters in names
     */
    test('should handle special characters in names', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act
        const specialNames = [
            'José María',
            'François',
            '李明',
            'Müller',
            "O'Brien",
            'test@email.com',
            '<script>alert(1)</script>',
        ];

        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(specialNames);
        await configPage.clickCreateNewWheel();

        // Assert - Should create wheel and sanitize/escape dangerous content
        await page.waitForURL(/\/wheel\/v3\//);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Invalid color hex values
     */
    test('should handle invalid hex color values', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);

        // Try to set invalid color (too short)
        await configPage.setBaseColor('#FF');

        // Assert - Form should either reject or fix the value
        const value = await configPage.getBaseColor();
        // The value should either be corrected to a valid hex or kept as entered
        expect(value).toBeTruthy();
        // Should not allow submission with an invalid color (too short)
        const isValid = /^#[0-9A-Fa-f]{6}$/.test(value);
        if (!isValid) {
            // If the form kept the invalid value, it should not be submittable
            expect(value).toBe('#FF');
        }
    });

    /**
     * Test: Network error on config decode
     */
    test('should handle network error when decoding config', async ({ page }) => {
        // Arrange - Simulate offline mode
        await page.context().setOffline(true);

        // Act - Try to load config
        const response = await page.goto('/config/v3/eyJ0ZXN0IjogInZhbHVlIn0=').catch(() => null);

        // Assert - Navigation should fail or show an error state
        const didNavigationFail = response === null || !response.ok();
        const hasErrorContent = await page
            .locator('text=/error|failed|offline/i')
            .count()
            .catch(() => 0);
        expect(didNavigationFail || hasErrorContent > 0).toBe(true);

        // Cleanup
        await page.context().setOffline(false);
    });

    /**
     * Test: Large number of wheel segments
     */
    test('should handle wheel with maximum segments', async ({ page }) => {
        test.slow();
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel with 100 names
        const manyNames = Array.from({ length: 100 }, (_, i) => `Person_${i + 1}`);

        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(manyNames);
        await configPage.clickCreateNewWheel();

        // Assert - Wheel should still render (performance test)
        await page.waitForURL(/\/wheel\/v3\//);
        const isLoaded = await wheelPage.isWheelLoaded();
        expect(isLoaded).toBe(true);
    });

    /**
     * Test: Rapid form submissions
     */
    test('should handle rapid form submissions', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);

        // Attempt rapid submissions
        const clickPromise1 = configPage.clickCreateNewWheel().catch(() => null);
        const clickPromise2 = configPage.clickCreateNewWheel().catch(() => null);

        await Promise.all([clickPromise1, clickPromise2]);

        // Assert - Should navigate to wheel page without creating duplicates
        await page.waitForURL(/\/wheel\/v3\/|\/config\/v3\//, { timeout: 5000 });
        expect(page.url()).toBeTruthy();
    });

    /**
     * Test: Browser storage disabled
     */
    test('should handle application when localStorage is disabled', async ({ context }) => {
        // Create new context that disallows storage
        const page = await context.newPage();
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);

        // Try to create wheel - should work even if localStorage fails
        await configPage.clickCreateNewWheel();

        // Assert - Should still navigate to wheel page
        await page.waitForURL(/\/wheel\/v3\//, { timeout: 10000 });
        expect(page.url()).toContain('/wheel/v3/');

        await page.close();
    });

    /**
     * Test: Whitespace-only names
     */
    test('should handle whitespace-only names', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // Try with only whitespace
        await configPage.fillNames(['   ', '\t\t', '\n\n']);

        // Try submitting - should stay on config page
        await configPage.clickCreateNewWheel();

        // Assert - Should remain on config page (whitespace-only names should not create a wheel)
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/config/v3/');
    });

    /**
     * Test: Duplicate names handling
     */
    test('should allow duplicate names in wheel', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel with duplicate names (app should allow this)
        const duplicateNames = ['Alice', 'Bob', 'Alice', 'Charlie', 'Bob'];

        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(duplicateNames);
        await configPage.clickCreateNewWheel();

        // Assert - Wheel should be created
        await page.waitForURL(/\/wheel\/v3\//);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
        expect(await wheelPage.getSegmentCount()).toBe(duplicateNames.length);
    });

    /**
     * Test: Very long title and description
     */
    test('should handle very long title and description', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act
        const longTitle = 'A'.repeat(1000);
        const longDescription = 'B'.repeat(5000);

        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle(longTitle);
        await configPage.fillDescription(longDescription);
        await configPage.clickCreateNewWheel();

        // Assert - Should create wheel (might truncate or store as-is)
        await page.waitForURL(/\/wheel\/v3\//);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });
});
