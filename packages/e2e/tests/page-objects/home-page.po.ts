import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.po';

/**
 * Page object representing the Home page for testing with Playwright.
 * Provides methods to interact with the landing page.
 */
export class HomePage extends BasePage {
    private readonly _mainContainer: Locator;
    private readonly _makeWheelButton: Locator;
    private readonly _pageTitle: Locator;

    /**
     * Creates an instance of HomePage.
     * @param page - The Playwright Page object
     */
    public constructor(page: Page) {
        super(page);
        this._mainContainer = page.getByRole('main');
        this._makeWheelButton = page.getByRole('button', { name: /make a wheel/i });
        this._pageTitle = this._mainContainer.getByRole('heading', { level: 1 });
    }

    /**
     * Navigates to the Home page.
     */
    public async goto(): Promise<void> {
        await this.page.goto('/');
    }

    /**
     * Gets the page title text.
     */
    public async getPageTitle(): Promise<string | null> {
        return this._pageTitle.textContent();
    }

    /**
     * Clicks the "Make a Wheel" button to navigate to wheel creation.
     */
    public async clickMakeWheelButton(): Promise<void> {
        await this._makeWheelButton.click();
    }

    /**
     * Checks if the "Make a Wheel" button is visible.
     */
    public async isMakeWheelButtonVisible(): Promise<boolean> {
        return this._makeWheelButton.isVisible();
    }
}
