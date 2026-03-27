import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.po';

/**
 * Page object representing the Wheel page (spinning wheel interface).
 * Provides methods to interact with the wheel and winner display.
 */
export class WheelPage extends BasePage {
    private readonly _mainContainer: Locator;
    private readonly _wheelContainer: Locator;
    private readonly _wheelElement: Locator;
    private readonly _wheelSegments: Locator;
    private readonly _winnerCard: Locator;
    private readonly _winnerText: Locator;
    private readonly _wheelBlur: Locator;
    private readonly _copyBannerButton: Locator;
    private readonly _removeWinnerButton: Locator;
    private readonly _wheelApplication: Locator;

    /**
     * Creates an instance of WheelPage.
     * @param page - The Playwright Page object
     */
    public constructor(page: Page) {
        super(page);
        this._mainContainer = page.getByRole('main');
        this._wheelContainer = page.locator('[class*="wheel"]').first();
        this._wheelApplication = page.locator('[role="application"]');
        this._wheelElement = this._wheelApplication; // The wheel is the application div
        this._wheelSegments = page.getByTestId('wheel-segment');
        this._winnerCard = page.locator('[role="dialog"]').first();
        this._winnerText = page.getByTestId('winner');
        this._wheelBlur = page.getByTestId('wheel-blur');
        this._copyBannerButton = page.getByRole('button', { name: /copy banner/i });
        this._removeWinnerButton = page.getByRole('button', { name: /remove winner/i });
    }

    /**
     * Navigates to the wheel page with an encoded config.
     * @param encodedConfig - Base64 encoded configuration
     */
    public async goto(encodedConfig: string): Promise<void> {
        await this.page.goto(`/wheel/v3/${encodedConfig}`);
    }

    /**
     * Waits for the wheel to load.
     */
    public async waitForWheelLoad(): Promise<void> {
        await this._wheelElement.waitFor({ state: 'visible' });
    }

    /**
     * Gets the number of segments on the wheel.
     */
    public async getSegmentCount(): Promise<number> {
        return this._wheelSegments.count();
    }

    /**
     * Spins the wheel by clicking at the center.
     */
    public async spinWheel(): Promise<void> {
        const wheel = this._wheelApplication;
        await wheel.click();
    }

    /**
     * Spins the wheel using keyboard (Space key).
     */
    public async spinWheelWithKeyboard(): Promise<void> {
        await this._wheelApplication.focus();
        await this.page.keyboard.press('Space');
    }

    /**
     * Drags on the wheel to manually spin it.
     * @param fromX - Starting X coordinate
     * @param fromY - Starting Y coordinate
     * @param toX - Ending X coordinate
     * @param toY - Ending Y coordinate
     */
    public async dragWheel(fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
        await this._wheelApplication.dragTo(this._wheelApplication, {
            sourcePosition: { x: fromX, y: fromY },
            targetPosition: { x: toX, y: toY },
        });
    }

    /**
     * Waits for a winner to be selected and displayed.
     * @param timeoutMs - Maximum time to wait
     */
    public async waitForWinner(timeoutMs = 10000): Promise<void> {
        await this._winnerCard.waitFor({ state: 'visible', timeout: timeoutMs });
    }

    /**
     * Gets the winner name text.
     */
    public async getWinnerName(): Promise<string | null> {
        await this.waitForWinner();
        return this._winnerText.textContent();
    }

    /**
     * Checks if a winner is currently displayed.
     */
    public async hasWinner(): Promise<boolean> {
        try {
            return await this._winnerCard.isVisible({ timeout: 1000 });
        } catch {
            return false;
        }
    }

    /**
     * Clicks the "Copy Banner" button to copy the winner banner to clipboard.
     */
    public async clickCopyBanner(): Promise<void> {
        await this._copyBannerButton.click();
    }

    /**
     * Clicks the "Remove Winner" button to remove the winner from the wheel.
     */
    public async clickRemoveWinner(): Promise<void> {
        await this._removeWinnerButton.click();
    }

    /**
     * Checks if the wheel is currently spinning (blur is visible).
     */
    public async isSpinning(): Promise<boolean> {
        try {
            return await this._wheelBlur.isVisible({ timeout: 500 });
        } catch {
            return false;
        }
    }

    /**
     * Waits for the wheel to stop spinning.
     * @param timeoutMs - Maximum time to wait
     */
    public async waitForSpinToComplete(timeoutMs = 10000): Promise<void> {
        await this._wheelBlur.waitFor({ state: 'hidden', timeout: timeoutMs });
    }

    /**
     * Gets the current rotation angle of the wheel.
     */
    public async getWheelRotation(): Promise<number> {
        const transform = await this._wheelElement.evaluate((el) => {
            return window.getComputedStyle(el).transform;
        });

        // Parse rotation from matrix or rotate transform
        const match = transform.match(/rotate\((.+?)deg\)/);
        if (match) {
            return parseFloat(match[1]);
        }

        // If it's a matrix, we'd need to extract rotation from there
        return 0;
    }

    /**
     * Gets all segment names visible on the wheel.
     */
    public async getSegmentNames(): Promise<string[]> {
        const names = await this.page.locator('[data-testid="wheel-segment-name"]').allTextContents();
        return names;
    }

    /**
     * Checks if the page contains a loaded wheel.
     */
    public async isWheelLoaded(): Promise<boolean> {
        try {
            await this._wheelElement.waitFor({ state: 'visible', timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }
}
