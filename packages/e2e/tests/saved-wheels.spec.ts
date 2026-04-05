import { expect, test } from '@playwright/test';
import { SAMPLE_WHEELS, TEST_DELAYS } from './fixtures/test-data';
import { ConfigPage } from './page-objects/config-page.po';
import { HomePage } from './page-objects/home-page.po';
import { NavBar } from './page-objects/navbar.po';
import { SavedWheelsDrawer } from './page-objects/saved-wheels.po';
import { WheelPage } from './page-objects/wheel-page.po';
import { clearLocalStorage, getSavedWheels } from './utils/storage';

/**
 * Test suite for saved wheels functionality.
 * Covers saving, loading, updating, and deleting wheels in localStorage.
 */
test.describe('Saved Wheels', () => {
    /**
     * Clear localStorage before each test
     */
    test.beforeEach(async ({ page }) => {
        // Navigate to home page first to establish context for localStorage
        await page.goto('/');
        await clearLocalStorage(page);
    });

    /**
     * Test: Save current wheel to localStorage
     */
    test('should save current wheel to localStorage', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Test Wheel 1');
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Save wheel
        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Assert - Wheel should be in localStorage
        const savedWheelsData = await getSavedWheels(page);
        expect(Object.keys(savedWheelsData).length).toBeGreaterThan(0);
    });

    /**
     * Test: Load saved wheel from drawer
     */
    test('should load saved wheel from drawer', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create and save first wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Saved Wheel');
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Navigate away
        await homePage.goto();

        // Open drawer and load saved wheel
        await savedWheels.openDrawer();
        const count = await savedWheels.getSavedWheelCount();
        expect(count).toBeGreaterThan(0);

        await savedWheels.loadWheelByIndex(0);

        // Assert - Should navigate to saved wheel
        await page.waitForURL(/\/wheel\/v3\//);
        expect(page.url()).toContain('/wheel/v3/');
    });

    /**
     * Test: Load saved wheel by title
     */
    test('should load saved wheel by title', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);
        const wheelTitle = 'My Special Wheel';

        // Act - Create and save wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle(wheelTitle);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Navigate away and load by title
        await homePage.goto();
        await savedWheels.openDrawer();
        await savedWheels.loadWheelByTitle(wheelTitle);

        // Assert - Should load the correct wheel
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.getSegmentCount()).toBe(SAMPLE_WHEELS.basic.names.length);
    });

    /**
     * Test: Delete saved wheel
     */
    test('should delete saved wheel from drawer', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);
        const wheelTitle = 'Wheel to Delete';

        // Act - Create and save wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle(wheelTitle);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Check it was saved
        let savedCount = await savedWheels.getSavedWheelCount();
        expect(savedCount).toBeGreaterThan(0);

        // Delete wheel
        await savedWheels.deleteWheelByTitle(wheelTitle);
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Assert - Wheel should be removed
        savedCount = await savedWheels.getSavedWheelCount();
        const titles = await savedWheels.getSavedWheelTitles();
        expect(titles).not.toContain(wheelTitle);
    });

    /**
     * Test: Update existing saved wheel vs create new
     */
    test('should auto-update existing saved wheel when modified', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create and save first wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Updating Wheel');
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        const initialCount = await savedWheels.getSavedWheelCount();

        // Close drawer before navigating via navbar
        await savedWheels.closeDrawer();

        // Modify the wheel
        const navbar = new NavBar(page);
        await navbar.clickChangeWheel();
        await configPage.waitForPageLoad();

        await configPage.fillNames(['X', 'Y', 'Z']);
        await configPage.clickUpdateWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Open drawer - the saved wheel should have been auto-updated
        await savedWheels.openDrawer();

        // Assert - Count should be the same (updated in-place, not a new entry)
        const finalCount = await savedWheels.getSavedWheelCount();
        expect(finalCount).toBe(initialCount);
    });

    /**
     * Test: Multiple saved wheels are listed
     */
    test('should display multiple saved wheels in drawer', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create and save multiple wheels
        const wheelTitles = ['Wheel 1', 'Wheel 2', 'Wheel 3'];

        for (const title of wheelTitles) {
            await homePage.goto();
            await homePage.clickMakeWheelButton();
            await configPage.waitForPageLoad();
            await configPage.fillNames(SAMPLE_WHEELS.basic.names);
            await configPage.fillTitle(title);
            await configPage.clickCreateNewWheel();

            await page.waitForURL(/\/wheel\/v3\//);
            await wheelPage.waitForWheelLoad();

            await savedWheels.openDrawer();
            await savedWheels.clickSaveCurrentWheel();
            await page.waitForTimeout(TEST_DELAYS.animation);
            await savedWheels.closeDrawer();
        }

        // Check saved wheels list
        await savedWheels.openDrawer();

        // Assert - All wheels should be listed
        const savedTitles = await savedWheels.getSavedWheelTitles();
        expect(savedTitles.length).toBeGreaterThanOrEqual(wheelTitles.length);
    });

    /**
     * Test: Saved wheels persist across page reload
     */
    test('should persist saved wheels after page reload', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);
        const wheelTitle = 'Persistent Wheel';

        // Act - Create and save wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle(wheelTitle);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        const countBefore = await savedWheels.getSavedWheelCount();

        // Reload page
        await page.reload();
        await homePage.goto();

        // Assert - Wheel should still be saved
        await savedWheels.openDrawer();
        const countAfter = await savedWheels.getSavedWheelCount();
        expect(countAfter).toBe(countBefore);

        const titles = await savedWheels.getSavedWheelTitles();
        expect(titles).toContain(wheelTitle);
    });

    /**
     * Test: Recently saved indicator appears
     */
    test('should show recently saved indicator on newly saved wheel', async ({ page }) => {
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
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Assert - First wheel should have active wheel indicator
        const isActive = await savedWheels.isWheelActive(0);
        expect(isActive).toBe(true);
    });

    /**
     * Test: Cannot save wheel without names
     */
    test('should save wheel even if only names are provided', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create minimal wheel with only names
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Save wheel
        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Assert - Wheel should be saved
        const count = await savedWheels.getSavedWheelCount();
        expect(count).toBeGreaterThan(0);
    });

    /**
     * Test: Saved wheels with special characters in title
     */
    test('should handle special characters in saved wheel titles', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);
        const specialTitle = "Team's 2024 @ Meeting #1";

        // Act - Create wheel with special character title
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle(specialTitle);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Assert - Title should be saved correctly
        const titles = await savedWheels.getSavedWheelTitles();
        expect(titles).toContain(specialTitle);
    });

    /**
     * Test: Empty title uses fallback name for saved wheel
     */
    test('should use fallback name when wheel has no title', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create wheel without title
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        // Don't set title - leave empty
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await savedWheels.openDrawer();
        await savedWheels.clickSaveCurrentWheel();
        await page.waitForTimeout(TEST_DELAYS.animation);

        // Assert - Should use first 100 chars of names as fallback
        const titles = await savedWheels.getSavedWheelTitles();
        expect(titles.length).toBeGreaterThan(0);
        // Should have some title even without explicit one
        expect(titles[0]).toBeTruthy();
    });
});
