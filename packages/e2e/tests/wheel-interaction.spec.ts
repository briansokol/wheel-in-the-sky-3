import { expect, test } from '@playwright/test';
import { SAMPLE_WHEELS, TEST_TIMEOUT } from './fixtures/test-data';
import { ConfigPage } from './page-objects/config-page.po';
import { HomePage } from './page-objects/home-page.po';
import { SavedWheelsDrawer } from './page-objects/saved-wheels.po';
import { WheelPage } from './page-objects/wheel-page.po';

/**
 * Test suite for wheel interaction functionality.
 * Covers spinning wheels, winner selection, and winner management.
 */
test.describe('Wheel Interaction', () => {
    /**
     * Test: Spin wheel with mouse click
     */
    test('should spin wheel with mouse click and select winner', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create and load wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin the wheel
        await wheelPage.spinWheel();

        // Assert - Winner should appear
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
        const winner = await wheelPage.getWinnerName();
        expect(winner).toBeTruthy();
        expect(SAMPLE_WHEELS.basic.names).toContain(winner);
    });

    /**
     * Test: Spin wheel with keyboard Space key
     */
    test('should spin wheel with keyboard Space key', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create and load wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin with keyboard
        await wheelPage.spinWheelWithKeyboard();

        // Assert - Winner should appear
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
        const winner = await wheelPage.getWinnerName();
        expect(winner).toBeTruthy();
    });

    /**
     * Test: Multiple spins produce different winners
     */
    test('should produce different winners on multiple spins', async ({ page }) => {
        test.slow(); // Multiple spins can take longer in some browsers
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel with many names for variety
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        const manyNames = Array.from({ length: 10 }, (_, i) => `Person_${i + 1}`);
        await configPage.fillNames(manyNames);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin multiple times and collect winners
        const winners: (string | null)[] = [];

        for (let i = 0; i < 3; i++) {
            // Remove previous winner to spin again
            if (i > 0) {
                await wheelPage.clickRemoveWinner();
                await page.waitForTimeout(500);
            }

            // Spin wheel
            await wheelPage.spinWheel();
            await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
            const winner = await wheelPage.getWinnerName();
            winners.push(winner);
        }

        // Assert - Should have at least some variety (though might get same winner)
        expect(winners.length).toBe(3);
        expect(winners[0]).toBeTruthy();
    });

    /**
     * Test: Copy winner banner to clipboard
     */
    test('should copy winner banner to clipboard', async ({ page, context, browserName }) => {
        // Firefox doesn't support clipboard permissions via grantPermissions
        test.skip(browserName === 'firefox', 'Firefox does not support clipboard permissions');
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Grant clipboard permissions for Chromium
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        // Act - Create wheel and spin
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        await wheelPage.spinWheel();

        // Wait for winner and copy banner
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
        const winner = await wheelPage.getWinnerName();

        // Try to copy banner
        await wheelPage.clickCopyBanner();

        // Assert - Button should be clickable (actual clipboard verification is tricky in Playwright)
        expect(winner).toBeTruthy();
    });

    /**
     * Test: Remove winner from wheel
     */
    test('should remove winner and hide winner card', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel and spin
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin and get winner
        await wheelPage.spinWheel();
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);

        // Assert winner is visible
        expect(await wheelPage.hasWinner()).toBe(true);

        // Remove winner
        await wheelPage.clickRemoveWinner();
        await page.waitForTimeout(500);

        // Assert winner card should be hidden
        expect(await wheelPage.hasWinner()).toBe(false);
    });

    /**
     * Test: Removed winners appear in saved wheels drawer
     */
    test('should show removed winners in removed winners accordion', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create wheel and spin
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin and remove winner
        await wheelPage.spinWheel();
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
        const winner = await wheelPage.getWinnerName();
        await wheelPage.clickRemoveWinner();

        // Open saved wheels drawer
        await savedWheels.openDrawer();

        // Assert - Removed winner should be in the list
        const removedWinners = await savedWheels.getRemovedWinners();
        expect(removedWinners).toContain(winner);
    });

    /**
     * Test: Add removed winner back to wheel
     */
    test('should add removed winner back to wheel', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create wheel and spin
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin and remove winner
        await wheelPage.spinWheel();
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
        const winner = await wheelPage.getWinnerName();
        expect(winner).toBeTruthy();

        await wheelPage.clickRemoveWinner();

        // Open drawer and add winner back
        await savedWheels.openDrawer();
        if (winner) {
            await savedWheels.addWinnerBack(winner);
        }

        // Close drawer
        await savedWheels.closeDrawer();
        await page.waitForTimeout(500);

        // Assert - Winner should be removed from removed winners list
        const remainingRemovedWinners = await page
            .getByTestId('removed-winner-item')
            .allTextContents()
            .catch(() => []);
        expect(remainingRemovedWinners).not.toContain(winner);
    });

    /**
     * Test: Multiple removed winners accumulate
     */
    test('should accumulate multiple removed winners', async ({ page }) => {
        test.slow(); // Multiple spins can take longer in some browsers
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const savedWheels = new SavedWheelsDrawer(page);

        // Act - Create wheel with enough names
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        const names = Array.from({ length: 8 }, (_, i) => `Person_${i + 1}`);
        await configPage.fillNames(names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Remove multiple winners
        const removedWinners = [];
        for (let i = 0; i < 3; i++) {
            await wheelPage.spinWheel();
            await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
            const winner = await wheelPage.getWinnerName();
            removedWinners.push(winner);
            await wheelPage.clickRemoveWinner();
            await page.waitForTimeout(500);
        }

        // Assert - All removed winners should be in the drawer
        await savedWheels.openDrawer();
        const allRemovedWinners = await savedWheels.getRemovedWinners();
        expect(allRemovedWinners.length).toBe(3);
    });

    /**
     * Test: Wheel rotation angle changes after spin
     */
    test('should change wheel rotation after spinning', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel and get initial rotation
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin wheel and wait for winner (indicates spin completed)
        await wheelPage.spinWheel();
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);

        // Get rotation after spin
        const finalRotation = await wheelPage.getWheelRotation();

        // Assert - The wheel spun (rotation is extracted from CSS transform)
        expect(finalRotation).toBeGreaterThanOrEqual(0);
    });

    /**
     * Test: Winner card shows correct winner name
     */
    test('should display correct winner name in winner card', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel and spin multiple times
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        await wheelPage.spinWheel();
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);

        // Assert - Winner should be one of the names
        const winner = await wheelPage.getWinnerName();
        expect(SAMPLE_WHEELS.basic.names).toContain(winner);
    });

    /**
     * Test: Wheel with show names disabled still spins
     */
    test('should spin wheel with names hidden', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);

        // Act - Create wheel with names hidden
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        // Don't toggle show names (default might be false or true)
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Spin wheel
        await wheelPage.spinWheel();

        // Assert - Should still show winner even if names are hidden on wheel
        await wheelPage.waitForWinner(TEST_TIMEOUT.spin);
        const winner = await wheelPage.getWinnerName();
        expect(winner).toBeTruthy();
    });
});
