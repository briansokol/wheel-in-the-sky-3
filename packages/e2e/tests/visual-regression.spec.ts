import { expect, test } from '@playwright/test';
import { BACKGROUND_OPTIONS, COLOR_SCHEMES, SAMPLE_WHEELS } from './fixtures/test-data';
import { ConfigPage } from './page-objects/config-page.po';
import { HomePage } from './page-objects/home-page.po';
import { SavedWheelsDrawer } from './page-objects/saved-wheels.po';
import { WheelPage } from './page-objects/wheel-page.po';

/**
 * Test suite for visual regression testing.
 * Uses Playwright screenshot comparisons to detect visual changes.
 */
test.describe('Visual Regression', () => {
    // Skip on CI until Linux baseline snapshots are generated
    // Run locally with --update-snapshots to generate platform-specific baselines
    test.skip(!!process.env.CI, 'Visual regression baselines not yet generated for Linux');

    /**
     * Test: Home page visual consistency
     */
    test('should maintain home page visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);

        // Act
        await homePage.goto();

        // Assert - Take screenshot for regression testing
        await expect(page).toHaveScreenshot('home-page.png', {
            fullPage: true,
            mask: [page.locator('[class*="carousel"]')], // Mask auto-rotating carousels if any
        });
    });

    /**
     * Test: Config page with basic form visual consistency
     */
    test('should maintain config page form visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // Assert
        await expect(page).toHaveScreenshot('config-page-empty.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Config page with filled form visual consistency
     */
    test('should maintain config page with filled form consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Test Wheel');
        await configPage.fillDescription('Test Description');

        // Assert
        await expect(page).toHaveScreenshot('config-page-filled.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Wheel preview visual consistency
     */
    test('should maintain wheel preview visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);

        // Make preview visible
        if (!(await configPage.isPreviewVisible())) {
            await configPage.togglePreview();
        }

        // Wait for preview to render
        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-preview.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Monochromatic color scheme visual consistency
     */
    test('should maintain monochromatic wheel visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const colorScheme = COLOR_SCHEMES.monochromatic;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Monochromatic');
        await configPage.setBaseColor(colorScheme.baseColor);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Wait for wheel to fully render
        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-monochromatic.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Analogous color scheme visual consistency
     */
    test('should maintain analogous wheel visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const colorScheme = COLOR_SCHEMES.analogous;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Analogous');
        await configPage.setBaseColor(colorScheme.baseColor);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-analogous.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Custom color scheme visual consistency
     */
    test('should maintain custom color wheel visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const colorScheme = COLOR_SCHEMES.custom;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Custom');
        await configPage.setBaseColor(colorScheme.colors[0]);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-custom.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Wheel with light background visual consistency
     */
    test('should maintain wheel with light background visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const bgColor = BACKGROUND_OPTIONS.lightBlue;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectBackgroundColor('Single Color');
        await configPage.setBackgroundColor(bgColor.color);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-light-background.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Wheel with dark background visual consistency
     */
    test('should maintain wheel with dark background visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const bgColor = BACKGROUND_OPTIONS.darkPurple;

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectBackgroundColor('Single Color');
        await configPage.setBackgroundColor(bgColor.color);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-dark-background.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Winner card visual consistency
     */
    test('should maintain winner card visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel and spin to winner
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin wheel
        await wheelPage.spinWheel();
        await wheelPage.waitForWinner(15000);
        await page.waitForTimeout(1000);

        // Assert - Screenshot of winner display
        await expect(page).toHaveScreenshot('wheel-winner-card.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Saved wheels drawer visual consistency
     */
    test('should maintain saved wheels drawer visual consistency', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create and save wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Screenshot Wheel');
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('saved-wheels-drawer.png', {
            fullPage: true,
        });
    });

    /**
     * Test: About page visual consistency
     */
    test('should maintain about page visual consistency', async ({ page }) => {
        // Act
        await page.goto('/about');

        // Wait for content to load
        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('about-page.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Mobile viewport visual consistency
     */
    test('should maintain responsive design on mobile viewport', async ({ page }) => {
        // Arrange
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-mobile.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Tablet viewport visual consistency
     */
    test('should maintain responsive design on tablet viewport', async ({ page }) => {
        // Arrange
        await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-tablet.png', {
            fullPage: true,
        });
    });

    /**
     * Test: Desktop viewport visual consistency (larger screen)
     */
    test('should maintain responsive design on large desktop viewport', async ({ page }) => {
        // Arrange
        await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await page.waitForTimeout(1000);

        // Assert
        await expect(page).toHaveScreenshot('wheel-desktop-large.png', {
            fullPage: true,
        });
    });
});
