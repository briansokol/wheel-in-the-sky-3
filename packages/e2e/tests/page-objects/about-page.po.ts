import { Locator, Page } from '@playwright/test';

/**
 * Page object representing the About page for testing with Playwright.
 * Provides methods and properties to interact with UI elements on the About page.
 */
export class AboutPage {
    // Private properties for page elements
    private readonly _page: Page;
    private readonly _mainContainer: Locator;
    private readonly _aboutTextArticle: Locator;
    private readonly _changelogArticle: Locator;
    private readonly _pageTitle: Locator;
    private readonly _technologyLinks: Locator;
    private readonly _supportLibraryLinks: Locator;
    private readonly _githubLink: Locator;
    private readonly _cloudflareLink: Locator;

    /**
     * Creates an instance of AboutPage.
     * @param page - The Playwright Page object
     */
    constructor(page: Page) {
        this._page = page;
        this._mainContainer = page.locator('main');
        this._aboutTextArticle = page.locator('[data-testid="about-text"]');
        this._changelogArticle = page.locator('[data-testid="changelog-text"]');
        this._pageTitle = this._aboutTextArticle.locator('h1');
        this._technologyLinks = this._aboutTextArticle.locator('ul').first().locator('li');
        this._supportLibraryLinks = this._aboutTextArticle.locator('ul').last().locator('li');
        this._githubLink = page.getByText('GitHub').locator('a');
        this._cloudflareLink = page.getByText('Cloudflare').locator('a');
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
        // Count the number of technology links
        const count = await this._technologyLinks.count();
        const technologies: { name: string; href: string | null }[] = [];

        // Iterate through each link element and extract information
        for (let i = 0; i < count; i++) {
            const link = this._technologyLinks.nth(i).locator('a');
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
        // Count the number of support library links
        const count = await this._supportLibraryLinks.count();
        const libraries: { name: string; href: string | null }[] = [];

        // Iterate through each link element and extract information
        for (let i = 0; i < count; i++) {
            const link = this._supportLibraryLinks.nth(i).locator('a');
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
