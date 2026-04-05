import { expect, test } from '@playwright/test';
import { SAMPLE_WHEELS } from './fixtures/test-data';
import { ConfigPage } from './page-objects/config-page.po';
import { HomePage } from './page-objects/home-page.po';
import { WheelPage } from './page-objects/wheel-page.po';

/**
 * Test suite for wheel loading and URL-based configuration persistence.
 * Covers loading wheels from URLs and verifying configuration preservation.
 */
test.describe('Wheel Loading', () => {
    /**
     * Test: Load a wheel from a valid encoded config URL
     */
    test('should load a wheel from URL with encoded config', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create a wheel and capture the URL
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Test Wheel');
        await configPage.clickCreateNewWheel();

        // Capture the wheel URL
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelUrl = page.url();

        // Navigate away and back to the same URL
        await homePage.goto();
        await page.goto(wheelUrl);

        // Assert - Wheel should load with same configuration
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.getSegmentCount()).toBe(SAMPLE_WHEELS.basic.names.length);
    });

    /**
     * Test: Load config page from URL with encoded config
     */
    test('should load config page from URL and show pre-filled form', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act - Create a wheel with specific config
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Test Wheel');
        await configPage.fillDescription('Test Description');
        await configPage.clickCreateNewWheel();

        // Get the wheel URL
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelUrl = page.url();
        const encodedConfig = wheelUrl.split('/').pop();

        // Navigate to config page with the same encoded config
        await configPage.goto(encodedConfig || 'new');
        await configPage.waitForPageLoad();

        // Assert - Form should be pre-filled
        const names = await configPage.getNames();
        const title = await configPage.getTitle();
        const description = await configPage.getDescription();

        expect(names).toContain('Alice');
        expect(title).toBe('Test Wheel');
        expect(description).toBe('Test Description');
    });

    /**
     * Test: Share wheel URL and open in new context
     */
    test('should load wheel in new browser context from shared URL', async ({ browser }) => {
        // Arrange
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();
        const homePage = new HomePage(page1);
        const configPage = new ConfigPage(page1);

        // Act - Create a wheel in first context
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page1.waitForURL(/\/wheel\/v3\//);
        const wheelUrl = page1.url();

        // Open the same URL in a new context
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        const wheelPage2 = new WheelPage(page2);

        await page2.goto(wheelUrl);
        await wheelPage2.waitForWheelLoad();

        // Assert - Both contexts should show the same wheel
        expect(await wheelPage2.getSegmentCount()).toBe(SAMPLE_WHEELS.basic.names.length);

        // Cleanup
        await context1.close();
        await context2.close();
    });

    /**
     * Test: URL encoding/decoding preserves special characters
     */
    test('should preserve special characters in wheel names through URL encoding', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act - Create wheel with special characters
        const specialNames = ['José', 'François', '李明', 'Müller', "O'Brien"];
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(specialNames);
        await configPage.clickCreateNewWheel();

        // Verify wheel loads
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelUrl = page.url();

        // Navigate to config page with encoded config
        const encodedConfig = wheelUrl.split('/').pop();
        await configPage.goto(encodedConfig || 'new');
        await configPage.waitForPageLoad();

        // Assert - Names should be preserved exactly
        const savedNames = await configPage.getNames();
        for (const name of specialNames) {
            expect(savedNames).toContain(name);
        }
    });

    /**
     * Test: Invalid encoded config shows error
     */
    test('should handle invalid encoded config gracefully', async ({ page }) => {
        // Arrange & Act - Navigate with invalid config
        await page.goto('/wheel/v3/invalid-base64-config!!!');

        // Assert - Should show error state
        await expect(page.getByText(/unable to load/i)).toBeVisible({ timeout: 10000 });
    });

    /**
     * Test: Corrupted encoded config shows error
     */
    test('should handle corrupted encoded config', async ({ page }) => {
        // Arrange & Act - Navigate with corrupted config
        const corruptedConfig = 'eyJpbnZhbGlkIjogImpzb24ifX0='; // Invalid JSON
        await page.goto(`/config/v3/${corruptedConfig}`);

        // Assert - Config page redirects to /config/v3/new on invalid config,
        // or shows "Unable to load configuration" error with a recovery button
        const createButton = page.getByRole('button', { name: /Create New Wheel/i });
        const errorHeading = page.getByText(/unable to load/i);

        await expect(createButton.or(errorHeading)).toBeVisible({ timeout: 10000 });
    });

    /**
     * Test: Navigate between wheel and config pages maintains state
     */
    test('should maintain config state when navigating between wheel and config pages', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        // Act - Create wheel with specific config
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        const testNames = ['Test1', 'Test2', 'Test3'];
        const testTitle = 'State Test';

        await configPage.fillNames(testNames);
        await configPage.fillTitle(testTitle);
        await configPage.clickCreateNewWheel();

        // Get URLs for both wheel and config pages
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelUrl = page.url();
        const encodedConfig = wheelUrl.split('/').pop();

        // Navigate to config via navbar
        const configUrl = `/config/v3/${encodedConfig}`;
        await page.goto(configUrl);
        await configPage.waitForPageLoad();

        // Assert - Config should match original
        expect(await configPage.getTitle()).toBe(testTitle);
        const names = await configPage.getNames();
        for (const name of testNames) {
            expect(names).toContain(name);
        }

        // Navigate back to wheel
        await page.goto(wheelUrl);
        await wheelPage.waitForWheelLoad();

        // Assert - Wheel should still be intact
        expect(await wheelPage.getSegmentCount()).toBe(testNames.length);
    });

    /**
     * Test: Very long URL with many names doesn't break
     */
    test('should handle wheel with many names and long URL', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel with 50 names
        const manyNames = Array.from({ length: 50 }, (_, i) => `Person_${i + 1}`);
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(manyNames);
        await configPage.clickCreateNewWheel();

        // Verify wheel loads despite long URL
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelUrl = page.url();

        // Navigate away and back
        await homePage.goto();
        await page.goto(wheelUrl);

        // Assert - Should load successfully
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.getSegmentCount()).toBe(manyNames.length);
    });

    /**
     * Test: Config with all options persists through URL
     */
    test('should preserve all configuration options through URL encoding', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act - Create wheel with all options enabled
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.detailed.names);
        await configPage.fillTitle(SAMPLE_WHEELS.detailed.title);
        await configPage.fillDescription(SAMPLE_WHEELS.detailed.description);

        // Record initial toggle states and toggle them
        const initialRandomize = await configPage.isRandomizeOrderChecked();
        await configPage.toggleRandomizeOrder();
        const initialShowNames = await configPage.isShowNamesChecked();
        await configPage.toggleShowNames();

        await configPage.selectColorScheme('Monochromatic');
        await configPage.setBaseColor('#FF0000');
        await configPage.selectBackgroundColor('Single Color');
        await configPage.setBackgroundColor('#FFFFFF');

        await configPage.clickCreateNewWheel();

        // Get URL and navigate to config page
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelUrl = page.url();
        const encodedConfig = wheelUrl.split('/').pop();

        await configPage.goto(encodedConfig || 'new');
        await configPage.waitForPageLoad();

        // Assert - All options should be preserved (toggles should be opposite of initial)
        expect(await configPage.getTitle()).toBe(SAMPLE_WHEELS.detailed.title);
        expect(await configPage.getDescription()).toBe(SAMPLE_WHEELS.detailed.description);
        expect(await configPage.isRandomizeOrderChecked()).toBe(!initialRandomize);
        expect(await configPage.isShowNamesChecked()).toBe(!initialShowNames);
        expect(await configPage.getSelectedColorScheme()).toContain('Monochromatic');
        expect(await configPage.getSelectedBackgroundColor()).toContain('Single');
    });
});
