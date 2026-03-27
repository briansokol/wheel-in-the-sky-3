import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.po';

/**
 * Page object representing the Navbar component for testing with Playwright.
 * Provides methods to interact with navigation elements.
 */
export class NavBar extends BasePage {
    private readonly _wheelLink: Locator;
    private readonly _createWheelLink: Locator;
    private readonly _changeWheelLink: Locator;
    private readonly _aboutLink: Locator;
    private readonly _actionsButton: Locator;
    private readonly _homeLink: Locator;

    /**
     * Creates an instance of NavBar.
     * @param page - The Playwright Page object
     */
    public constructor(page: Page) {
        super(page);
        this._homeLink = page.getByRole('link', { name: /wheel in the sky/i });
        this._wheelLink = page.getByRole('link', { name: /^wheel$/i });
        this._createWheelLink = page.getByRole('link', { name: /create wheel/i });
        this._changeWheelLink = page.getByRole('link', { name: /change wheel/i });
        this._aboutLink = page.getByRole('link', { name: /about/i });
        this._actionsButton = page.getByRole('button', { name: /actions/i });
    }

    /**
     * Navigates to home page by clicking the home link.
     */
    public async clickHome(): Promise<void> {
        await this._homeLink.click();
    }

    /**
     * Navigates to the wheel page by clicking the Wheel link.
     * Only visible when a wheel is loaded.
     */
    public async clickWheel(): Promise<void> {
        await this._wheelLink.click();
    }

    /**
     * Navigates to create wheel page.
     */
    public async clickCreateWheel(): Promise<void> {
        await this._createWheelLink.click();
    }

    /**
     * Navigates to change wheel (config) page.
     * Only visible when a wheel is loaded.
     */
    public async clickChangeWheel(): Promise<void> {
        await this._changeWheelLink.click();
    }

    /**
     * Navigates to about page.
     */
    public async clickAbout(): Promise<void> {
        await this._aboutLink.click();
    }

    /**
     * Opens the actions drawer by clicking the Actions button.
     */
    public async clickActions(): Promise<void> {
        await this._actionsButton.click();
    }

    /**
     * Checks if the Wheel link is visible.
     * @returns True if the Wheel link is visible
     */
    public async isWheelLinkVisible(): Promise<boolean> {
        return this._wheelLink.isVisible();
    }

    /**
     * Checks if the Create Wheel link is visible.
     */
    public async isCreateWheelLinkVisible(): Promise<boolean> {
        return this._createWheelLink.isVisible();
    }

    /**
     * Checks if the Change Wheel link is visible.
     */
    public async isChangeWheelLinkVisible(): Promise<boolean> {
        return this._changeWheelLink.isVisible();
    }
}
