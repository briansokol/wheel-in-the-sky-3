import { Page } from '@playwright/test';

/**
 * Base page object class providing common functionality for all page objects.
 */
export class BasePage {
    /** Playwright Page object */
    protected readonly page: Page;

    /**
     * Creates an instance of BasePage.
     * @param page - The Playwright Page object
     */
    public constructor(page: Page) {
        this.page = page;
    }

    /**
     * Navigates to a specific URL.
     * @param url - The URL path to navigate to
     * @returns Promise that resolves when navigation completes
     */
    public async goto(url: string): Promise<void> {
        await this.page.goto(url);
    }
}
