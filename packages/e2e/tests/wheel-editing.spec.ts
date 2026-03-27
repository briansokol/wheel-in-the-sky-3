import { expect, test } from '@playwright/test';
import { COLOR_SCHEMES, SAMPLE_WHEELS } from './fixtures/test-data';
import { ConfigPage } from './page-objects/config-page.po';
import { HomePage } from './page-objects/home-page.po';
import { NavBar } from './page-objects/navbar.po';
import { WheelPage } from './page-objects/wheel-page.po';

/**
 * Test suite for wheel editing functionality.
 * Covers editing existing wheels and updating configurations.
 */
test.describe('Wheel Editing', () => {
    /**
     * Test: Navigate from wheel to config page to edit
     */
    test('should navigate to config page from wheel page', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create a basic wheel first
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        // Wait for wheel page
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Navigate back to config via navbar
        expect(await navBar.isChangeWheelLinkVisible()).toBe(true);
        await navBar.clickChangeWheel();

        // Assert - should be on config page
        await page.waitForURL(/\/config\/v3\//);
        await configPage.waitForPageLoad();
        const names = await configPage.getNames();
        expect(names).toContain('Alice');
    });

    /**
     * Test: Edit wheel names and verify changes persist
     */
    test('should edit wheel names and update', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create initial wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Edit the wheel
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        // Change names
        const newNames = ['Xavier', 'Yara', 'Zoe'];
        await configPage.fillNames(newNames);

        // Update wheel (not create new)
        await configPage.clickUpdateWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.getSegmentCount()).toBe(newNames.length);
    });

    /**
     * Test: Change color scheme from Monochromatic to Analogous
     */
    test('should change wheel color scheme from monochromatic to analogous', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create wheel with monochromatic
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Monochromatic');
        await configPage.setBaseColor(COLOR_SCHEMES.monochromatic.baseColor);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Navigate to config and change colors
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        // Change to analogous
        await configPage.selectColorScheme('Analogous');
        await configPage.setBaseColor(COLOR_SCHEMES.analogous.baseColor);
        await configPage.clickUpdateWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Change color scheme to Custom
     */
    test('should change wheel color scheme to custom', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create initial wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Monochromatic');
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Edit to custom colors
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        await configPage.selectColorScheme('Custom');
        await configPage.setBaseColor(COLOR_SCHEMES.custom.colors[0]);
        await configPage.clickUpdateWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Update wheel to have randomized order enabled
     */
    test('should enable randomize order on existing wheel', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create wheel without randomization
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        expect(await configPage.isRandomizeOrderChecked()).toBe(false);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Edit to add randomization
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        await configPage.toggleRandomizeOrder();
        expect(await configPage.isRandomizeOrderChecked()).toBe(true);
        await configPage.clickUpdateWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Toggle segment names visibility
     */
    test('should toggle segment names visibility', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create wheel with names shown
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.toggleShowNames();
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Edit to hide names
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        const wasShowNamesChecked = await configPage.isShowNamesChecked();
        await configPage.toggleShowNames();
        expect(await configPage.isShowNamesChecked()).toBe(!wasShowNamesChecked);

        await configPage.clickUpdateWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Update wheel title and description
     */
    test('should update wheel title and description', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create initial wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.fillTitle('Original Title');
        await configPage.fillDescription('Original Description');
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Edit title and description
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        await configPage.fillTitle('Updated Title');
        await configPage.fillDescription('Updated Description');

        expect(await configPage.getTitle()).toBe('Updated Title');
        expect(await configPage.getDescription()).toBe('Updated Description');

        await configPage.clickUpdateWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });

    /**
     * Test: Create new wheel from existing config (vs updating)
     */
    test('should create new wheel instead of updating when "Create New" is clicked', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create initial wheel and capture URL
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        const firstWheelUrl = page.url();

        // Navigate to config
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        // Modify and click "Create New Wheel"
        const newNames = ['X', 'Y', 'Z'];
        await configPage.fillNames(newNames);
        await configPage.clickCreateNewWheel();

        // Assert - Should have different URL
        await page.waitForURL(/\/wheel\/v3\//);
        const secondWheelUrl = page.url();
        expect(secondWheelUrl).not.toBe(firstWheelUrl);
    });

    /**
     * Test: Verify update button is visible when editing
     */
    test('should show "Update Existing Wheel" button when editing', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create initial wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();

        // On new wheel creation page, should only have "Create New Wheel"
        expect(await configPage.isCreateNewWheelButtonVisible()).toBe(true);
        expect(await configPage.isUpdateWheelButtonVisible()).toBe(false);

        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Navigate to edit
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        // Assert - Should show both buttons
        expect(await configPage.isCreateNewWheelButtonVisible()).toBe(true);
        expect(await configPage.isUpdateWheelButtonVisible()).toBe(true);
    });

    /**
     * Test: Edit multiple color properties
     */
    test('should edit multiple color properties in one update', async ({ page }) => {
        // Arrange
        const homePage = new HomePage(page);
        const configPage = new ConfigPage(page);
        const wheelPage = new WheelPage(page);
        const navBar = new NavBar(page);

        // Act - Create initial wheel
        await homePage.goto();
        await homePage.clickMakeWheelButton();
        await configPage.waitForPageLoad();
        await configPage.fillNames(SAMPLE_WHEELS.basic.names);
        await configPage.selectColorScheme('Monochromatic');
        await configPage.setBaseColor('#FF0000');
        await configPage.clickCreateNewWheel();

        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();

        // Edit multiple color settings
        await navBar.clickChangeWheel();
        await configPage.waitForPageLoad();

        await configPage.selectColorScheme('Analogous');
        await configPage.setBaseColor('#00FF00');
        await configPage.toggleRandomizeColor();

        expect(await configPage.getSelectedColorScheme()).toContain('Analogous');
        expect(await configPage.getBaseColor()).toContain('#00FF00');
        expect(await configPage.isRandomizeColorChecked()).toBe(true);

        await configPage.clickUpdateWheel();

        // Assert
        await page.waitForURL(/\/wheel\/v3\//);
        await wheelPage.waitForWheelLoad();
        expect(await wheelPage.isWheelLoaded()).toBe(true);
    });
});
