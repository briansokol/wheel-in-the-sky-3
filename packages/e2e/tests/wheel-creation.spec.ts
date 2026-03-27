import { expect, test } from '@playwright/test';
import { BACKGROUND_OPTIONS, COLOR_SCHEMES, SAMPLE_WHEELS } from './fixtures/test-data';
import { ConfigPage } from './page-objects/config-page.po';
import { HomePage } from './page-objects/home-page.po';
import { WheelPage } from './page-objects/wheel-page.po';

/**
 * Test suite for wheel creation functionality.
 * Covers creating wheels with different configurations and color schemes.
 */
test.describe('Wheel Creation', () => {
    /**
     * Test: Create a basic wheel with minimal configuration
     */
    test('should create a basic wheel with names only', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // Fill in required field
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert - should navigate to wheel page
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
        expect(await wheelPage.getSegmentCount()).toBe(SAMPLE_WHEELS.basic.names.length);
    });

    /**
     * Test: Create a wheel with all optional fields
     */
    test('should create a wheel with title, description, and options', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelData = SAMPLE_WHEELS.detailed;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // Fill form with all fields
        await configPage.fillNames(wheelData.names);
        await configPage.fillTitle(wheelData.title);
        await configPage.fillDescription(wheelData.description);
        await configPage.toggleRandomizeOrder();
        await configPage.toggleShowNames();

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
        expect(await wheelPage.getSegmentCount()).toBe(wheelData.names.length);
    });

    /**
     * Test: Create a wheel with Monochromatic color scheme
     */
    test('should create a wheel with monochromatic colors', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const colorScheme = COLOR_SCHEMES.monochromatic;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Monochromatic');
        await configPage.setBaseColor(colorScheme.baseColor);

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Create a wheel with Analogous color scheme
     */
    test('should create a wheel with analogous colors', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const colorScheme = COLOR_SCHEMES.analogous;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Analogous');
        await configPage.setBaseColor(colorScheme.baseColor);

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Create a wheel with Custom colors
     */
    test('should create a wheel with custom colors', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const colorScheme = COLOR_SCHEMES.custom;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Custom');

        // Set custom colors (Note: Implementation depends on actual UI)
        // For now, just set the base color
        await configPage.setBaseColor(colorScheme.colors[0]);

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Create a wheel with Random colors
     */
    test('should create a wheel with random colors', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Random');

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Create a wheel with custom background color
     */
    test('should create a wheel with custom background color', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const bgColor = BACKGROUND_OPTIONS.lightBlue;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectBackgroundColor('Single');
        await configPage.setBackgroundColor(bgColor.color);

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Create a wheel with randomized color order
     */
    test('should create a wheel with randomized color order', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Monochromatic');
        await configPage.toggleRandomizeColor();

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Preview is visible and toggleable
     */
    test('should show wheel preview on config page', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);

        // Assert - preview should be visible
        expect(await configPage.isPreviewVisible()).toBe(true);

        // Toggle preview off and on
        await configPage.togglePreview();
        expect(await configPage.isPreviewVisible()).toBe(false);

        await configPage.togglePreview();
        expect(await configPage.isPreviewVisible()).toBe(true);
    });

    /**
     * Test: Form validation - cannot submit without names
     */
    test('should not allow form submission without names', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // Assert - button should be disabled or form should be invalid
        const canSubmit = await configPage.canSubmit();
        expect(canSubmit).toBe(false);
    });

    /**
     * Test: Create wheel with many names
     */
    test('should create a wheel with many names (20 participants)', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelData = SAMPLE_WHEELS.manyNames;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(wheelData.names);
        await configPage.fillTitle(wheelData.title);

        // Create the wheel
        await configPage.clickCreateNewWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        const wheelPage = new WheelPage(page);
        expect(await wheelPage.isWheelLoaded()).toBe(true);
        expect(await wheelPage.getSegmentCount()).toBe(wheelData.names.length);
    });

    /**
     * Test: Reset form button clears all fields
     */
    test('should reset form to initial state', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // Fill form
        await configPage.fillNames(['Alice', 'Bob']);
        await configPage.fillTitle('Test Wheel');
        await configPage.fillDescription('Test Description');

        // Reset form
        await configPage.clickResetForm();

        // Assert - fields should be empty
        expect(await configPage.getNames()).toBe('');
        expect(await configPage.getTitle()).toBe('');
        expect(await configPage.getDescription()).toBe('');
    });
});
