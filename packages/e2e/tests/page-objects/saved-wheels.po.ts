import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.po';

/**
 * Page object representing the Saved Wheels drawer/accordion.
 * Provides methods to interact with saved wheels and removed winners.
 */
export class SavedWheelsDrawer extends BasePage {
    private readonly _actionsButton: Locator;
    private readonly _drawer: Locator;
    private readonly _savedWheelsAccordion: Locator;
    private readonly _removedWinnersAccordion: Locator;
    private readonly _wheelListItems: Locator;
    private readonly _saveCurrentWheelButton: Locator;
    private readonly _loadButtons: Locator;
    private readonly _deleteButtons: Locator;
    private readonly _removedWinnersList: Locator;

    /**
     * Creates an instance of SavedWheelsDrawer.
     * @param page - The Playwright Page object
     */
    public constructor(page: Page) {
        super(page);
        this._actionsButton = page.getByRole('button', { name: /actions/i });
        this._drawer = page.getByRole('dialog');
        this._savedWheelsAccordion = page.locator('[role="region"]').filter({ hasText: /Saved Wheels/ });
        this._removedWinnersAccordion = page.locator('[role="region"]').filter({ hasText: /Removed Winners/ });
        this._wheelListItems = page.locator('[class*="saved-wheel"]');
        this._saveCurrentWheelButton = page.getByRole('button', { name: /save current wheel/i });
        this._loadButtons = page.getByRole('button', { name: /load/i });
        this._deleteButtons = page.getByRole('button', { name: /delete/i });
        this._removedWinnersList = page.locator('[class*="removed-winner"]');
    }

    /**
     * Opens the actions drawer by clicking the Actions button.
     */
    public async openDrawer(): Promise<void> {
        await this._actionsButton.click();
        await this._drawer.waitFor({ state: 'visible' });
    }

    /**
     * Closes the drawer (if visible).
     */
    public async closeDrawer(): Promise<void> {
        const closeButton = this.page.getByRole('button', { name: /close/i }).first();
        if (await closeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeButton.click();
        }
    }

    /**
     * Clicks the "Save Current Wheel" button.
     */
    public async clickSaveCurrentWheel(): Promise<void> {
        await this._saveCurrentWheelButton.click();
    }

    /**
     * Gets the number of saved wheels.
     */
    public async getSavedWheelCount(): Promise<number> {
        return this._wheelListItems.count();
    }

    /**
     * Gets all saved wheel titles.
     */
    public async getSavedWheelTitles(): Promise<string[]> {
        const count = await this._wheelListItems.count();
        const titles: string[] = [];

        for (let i = 0; i < count; i++) {
            const title = await this._wheelListItems.nth(i).locator('[class*="title"]').textContent();
            if (title) {
                titles.push(title.trim());
            }
        }

        return titles;
    }

    /**
     * Loads a saved wheel by index.
     * @param index - Index of the wheel to load
     */
    public async loadWheelByIndex(index: number): Promise<void> {
        const loadButton = this._wheelListItems.nth(index).getByRole('button', { name: /load/i });
        await loadButton.click();
    }

    /**
     * Loads a saved wheel by title.
     * @param title - Title of the wheel to load
     */
    public async loadWheelByTitle(title: string): Promise<void> {
        const wheelItem = this._wheelListItems.filter({ hasText: title }).first();
        const loadButton = wheelItem.getByRole('button', { name: /load/i });
        await loadButton.click();
    }

    /**
     * Deletes a saved wheel by index.
     * @param index - Index of the wheel to delete
     */
    public async deleteWheelByIndex(index: number): Promise<void> {
        const deleteButton = this._wheelListItems.nth(index).getByRole('button', { name: /delete/i });
        await deleteButton.click();
    }

    /**
     * Deletes a saved wheel by title.
     * @param title - Title of the wheel to delete
     */
    public async deleteWheelByTitle(title: string): Promise<void> {
        const wheelItem = this._wheelListItems.filter({ hasText: title }).first();
        const deleteButton = wheelItem.getByRole('button', { name: /delete/i });
        await deleteButton.click();
    }

    /**
     * Checks if the "Saved Wheels" accordion is visible.
     */
    public async isSavedWheelsAccordionVisible(): Promise<boolean> {
        return this._savedWheelsAccordion.isVisible();
    }

    /**
     * Checks if the "Removed Winners" accordion is visible.
     */
    public async isRemovedWinnersAccordionVisible(): Promise<boolean> {
        return this._removedWinnersAccordion.isVisible();
    }

    /**
     * Gets the number of removed winners.
     */
    public async getRemovedWinnersCount(): Promise<number> {
        return this._removedWinnersList.count();
    }

    /**
     * Gets all removed winner names.
     */
    public async getRemovedWinners(): Promise<string[]> {
        const count = await this._removedWinnersList.count();
        const winners: string[] = [];

        for (let i = 0; i < count; i++) {
            const name = await this._removedWinnersList.nth(i).textContent();
            if (name) {
                winners.push(name.trim());
            }
        }

        return winners;
    }

    /**
     * Adds a removed winner back to the wheel by clicking it.
     * @param winnerName - Name of the winner to add back
     */
    public async addWinnerBack(winnerName: string): Promise<void> {
        const winner = this._removedWinnersList.filter({ hasText: winnerName }).first();
        await winner.click();
    }

    /**
     * Checks if a specific wheel is marked as the active/current wheel.
     * @param index - Index of the wheel to check
     */
    public async isWheelActive(index: number): Promise<boolean> {
        const wheelItem = this._wheelListItems.nth(index);
        const activeBorder = wheelItem.locator('[class*="border"]');
        return activeBorder.isVisible();
    }

    /**
     * Gets recently saved wheel indicator (usually green border).
     */
    public async getRecentlySavedIndicator(): Promise<boolean> {
        const recentlyTag = this.page.locator('[class*="recently-saved"]').first();
        return recentlyTag.isVisible();
    }

    /**
     * Gets recently updated wheel indicator (usually blue border).
     */
    public async getRecentlyUpdatedIndicator(): Promise<boolean> {
        const recentlyTag = this.page.locator('[class*="recently-updated"]').first();
        return recentlyTag.isVisible();
    }
}
