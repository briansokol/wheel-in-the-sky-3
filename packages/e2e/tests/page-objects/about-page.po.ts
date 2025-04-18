import { Locator, Page } from '@playwright/test';

/**
 * Page object representing the About page for testing with Playwright.
 * Provides methods and properties to interact with UI elements on the About page.
 */
export class AboutPage {
    /** Playwright Page object */
    private readonly _page: Page;
    /** Main container element */
    private readonly _mainContainer: Locator;
    /** About text article element */
    private readonly _aboutTextArticle: Locator;
    /** Changelog article element */
    private readonly _changelogArticle: Locator;
    /** Page title heading element */
    private readonly _pageTitle: Locator;
    /** Technology links list items */
    private readonly _technologyLinks: Locator;
    /** Support library links list items */
    private readonly _supportLibraryLinks: Locator;
    /** GitHub link element */
    private readonly _githubLink: Locator;
    /** Cloudflare link element */
    private readonly _cloudflareLink: Locator;

    /**
     * Creates an instance of AboutPage.
     * @param page - The Playwright Page object
     */
    public constructor(page: Page) {
        this._page = page;
        this._mainContainer = page.getByRole('main');
        this._aboutTextArticle = page.getByTestId('about-text');
        this._changelogArticle = page.getByTestId('changelog-text');
        this._pageTitle = this._aboutTextArticle.getByRole('heading', { level: 1 });
        this._technologyLinks = page.getByTestId('technology-links');
        this._supportLibraryLinks = page.getByTestId('library-links');
        this._githubLink = page.getByRole('link', { name: 'GitHub' });
        this._cloudflareLink = page.getByRole('link', { name: 'Cloudflare' });
    }

    /**
     * Navigates to the About page.
     * @param baseUrl - Optional base URL to navigate to (defaults to '/about')
     * @returns Promise that resolves when navigation completes
     */
    public async goto(baseUrl = '/about'): Promise<void> {
        await this._page.goto(baseUrl);
    }

    /**
     * Gets the page title text.
     * @returns Promise resolving to the text content of the page title
     */
    public async getPageTitle(): Promise<string | null> {
        return this._pageTitle.textContent();
    }

    /**
     * Gets the about text article content.
     * @returns Promise resolving to the text content of the about article
     */
    public async getAboutText(): Promise<string | null> {
        return this._aboutTextArticle.textContent();
    }

    /**
     * Gets the changelog content.
     * @returns Promise resolving to the text content of the changelog
     */
    public async getChangelogText(): Promise<string | null> {
        return this._changelogArticle.textContent();
    }

    /**
     * Checks if the page title is visible.
     * @returns Promise resolving to true if the title is visible
     */
    public async isPageTitleVisible(): Promise<boolean> {
        return this._pageTitle.isVisible();
    }

    /**
     * Gets all technology links displayed on the page.
     * @returns Promise resolving to an array of objects containing name and href of each technology
     */
    public async getTechnologyLinks(): Promise<{ name: string; href: string | null }[]> {
        await this._technologyLinks.waitFor();

        // Count the number of technology links
        const links = this._technologyLinks.getByRole('listitem');
        const count = await links.count();
        const technologies: { name: string; href: string | null }[] = [];

        // Iterate through each link element and extract information
        for (let i = 0; i < count; i++) {
            const link = links.nth(i).getByRole('link');
            const name = await link.textContent();
            const href = await link.getAttribute('href');
            technologies.push({ name: name?.trim() || '', href });
        }

        return technologies;
    }

    /**
     * Gets all support library links displayed on the page.
     * @returns Promise resolving to an array of objects containing name and href of each library
     */
    public async getSupportLibraryLinks(): Promise<{ name: string; href: string | null }[]> {
        await this._supportLibraryLinks.waitFor();

        // Count the number of support library links
        const links = this._supportLibraryLinks.getByRole('listitem');
        const count = await this._supportLibraryLinks.count();
        const libraries: { name: string; href: string | null }[] = [];

        // Iterate through each link element and extract information
        for (let i = 0; i < count; i++) {
            const link = links.nth(i).locator('a');
            const name = await link.textContent();
            const href = await link.getAttribute('href');
            libraries.push({ name: name?.trim() || '', href });
        }

        return libraries;
    }

    /**
     * Clicks on the GitHub link.
     * @returns Promise that resolves when click action completes
     */
    public async clickGithubLink(): Promise<void> {
        await this._githubLink.click();
    }

    /**
     * Clicks on the Cloudflare link.
     * @returns Promise that resolves when click action completes
     */
    public async clickCloudflareLink(): Promise<void> {
        await this._cloudflareLink.click();
    }

    /**
     * Checks if the copyright text includes the current year.
     * @returns Promise resolving to true if current year is found in copyright text
     */
    public async hasCopyrightWithCurrentYear(): Promise<boolean> {
        const currentYear = new Date().getFullYear().toString();
        const copyrightText = await this._aboutTextArticle.getByText(`©${currentYear}`).textContent();
        return copyrightText !== null && copyrightText.includes(currentYear);
    }
}
