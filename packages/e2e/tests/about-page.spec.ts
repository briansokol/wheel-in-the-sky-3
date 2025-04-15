import { expect, test } from '@playwright/test';
import { AboutPage } from './page-objects/about-page.po';

/**
 * Test suite for the About page functionality
 */
test.describe('About Page Tests', () => {
    /**
     * Test to verify the page title is displayed correctly
     */
    test('should display the correct page title', async ({ page }) => {
        // Arrange
        const aboutPage = new AboutPage(page);

        // Act
        await aboutPage.goto();
        const title = await aboutPage.getPageTitle();

        // Assert
        expect(title).toBe('About Wheel in the Sky');
    });

    /**
     * Test to verify that the About page displays technology links
     */
    test.skip('should display technology links', async ({ page }) => {
        // Arrange
        const aboutPage = new AboutPage(page);

        // Act
        await aboutPage.goto();
        const techLinks = await aboutPage.getTechnologyLinks();

        // Assert
        expect(techLinks.length).toBeGreaterThan(0);

        // Verify that React is one of the technologies listed
        const reactLink = techLinks.find((link) => link.name === 'React');
        expect(reactLink).toBeDefined();
        expect(reactLink?.href).toContain('reactjs.org');
    });

    /**
     * Test to verify that the About page displays support library links
     */
    test.skip('should display support library links', async ({ page }) => {
        // Arrange
        const aboutPage = new AboutPage(page);

        // Act
        await aboutPage.goto();
        const libraryLinks = await aboutPage.getSupportLibraryLinks();

        // Assert
        expect(libraryLinks.length).toBeGreaterThan(0);

        // Verify that Vite is one of the libraries listed
        const viteLink = libraryLinks.find((link) => link.name === 'Vite');
        expect(viteLink).toBeDefined();
        expect(viteLink?.href).toContain('vite.dev');
    });

    /**
     * Test to verify that the copyright text includes the current year
     */
    test('should display copyright with current year', async ({ page }) => {
        // Arrange
        const aboutPage = new AboutPage(page);

        // Act
        await aboutPage.goto();
        const hasCopyrightWithCurrentYear = await aboutPage.hasCopyrightWithCurrentYear();

        // Assert
        expect(hasCopyrightWithCurrentYear).toBe(true);
    });
});
