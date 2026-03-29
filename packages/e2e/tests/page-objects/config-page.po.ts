import { Locator, Page } from '@playwright/test';
import { BasePage } from './base.po';

/**
 * Page object representing the Config (wheel creation/editing) page.
 * Provides methods to interact with the wheel configuration form.
 */
export class ConfigPage extends BasePage {
    private readonly _mainContainer: Locator;
    private readonly _namesTextarea: Locator;
    private readonly _titleInput: Locator;
    private readonly _descriptionInput: Locator;
    private readonly _randomizeOrderSwitch: Locator;
    private readonly _showNamesSwitch: Locator;
    private readonly _wheelColorSelect: Locator;
    private readonly _baseColorPicker: Locator;
    private readonly _baseColorHexInput: Locator;
    private readonly _customColorsContainer: Locator;
    private readonly _addColorButton: Locator;
    private readonly _randomizeColorSwitch: Locator;
    private readonly _appBackgroundColorSelect: Locator;
    private readonly _backgroundColorPicker: Locator;
    private readonly _backgroundColorHexInput: Locator;
    private readonly _createNewWheelButton: Locator;
    private readonly _updateWheelButton: Locator;
    private readonly _resetFormButton: Locator;
    private readonly _wheelPreview: Locator;
    private readonly _previewToggleButton: Locator;
    private readonly _pageTitle: Locator;

    /**
     * Creates an instance of ConfigPage.
     * @param page - The Playwright Page object
     */
    public constructor(page: Page) {
        super(page);
        this._mainContainer = page.getByRole('main');
        this._pageTitle = this._mainContainer.getByRole('heading', { level: 1 });
        this._namesTextarea = page.locator('textarea[placeholder*="One per line"]');
        this._titleInput = page.locator('input[placeholder*="Enter a title"]');
        this._descriptionInput = page.locator('input[placeholder*="Describe your wheel"]');
        this._randomizeOrderSwitch = page.getByLabel('Randomize Order Every So Often');
        this._showNamesSwitch = page.getByLabel('Show Labels on Wheel');
        this._wheelColorSelect = page.getByTestId('wheel-color-select');
        this._baseColorPicker = page.locator('[data-testid="picker-color-list"]').first();
        this._baseColorHexInput = page.getByLabel('Chosen Color').first();
        this._customColorsContainer = page.getByTestId('picker-color-list');
        this._addColorButton = page.getByRole('button', { name: /add/i }).filter({ hasText: /color/i });
        this._randomizeColorSwitch = page.getByLabel('Randomize Color Order');
        this._appBackgroundColorSelect = page.getByTestId('app-background-color-select');
        this._backgroundColorPicker = page.locator('[data-testid="picker-color-list"]').nth(1);
        this._backgroundColorHexInput = page.getByLabel('Chosen Color').nth(1);
        this._createNewWheelButton = page.getByRole('button', { name: /Create New Wheel/i });
        this._updateWheelButton = page.getByRole('button', { name: /Update Existing Wheel/i });
        this._resetFormButton = page.getByRole('button', { name: /Reset Form/i });
        this._wheelPreview = page.getByTestId('wheel-preview');
        this._previewToggleButton = page
            .getByRole('button')
            .filter({ hasText: /Preview/i })
            .first();
    }

    /**
     * Navigates to the config page with optional ID.
     * @param id - Optional ID for editing existing wheel (default: 'new')
     */
    public async goto(id = 'new'): Promise<void> {
        await this.page.goto(`/config/v3/${id}`);
    }

    /**
     * Waits for the page to load (skeletons to disappear).
     */
    public async waitForPageLoad(): Promise<void> {
        await this.page.locator('[data-testid="skeleton"]').first().waitFor({ state: 'hidden' });
    }

    /**
     * Fills in the names field with comma-separated values.
     * @param names - Array of names to add to the wheel
     */
    public async fillNames(names: string[]): Promise<void> {
        await this._namesTextarea.fill(names.join('\n'));
    }

    /**
     * Gets the current value of the names field.
     */
    public async getNames(): Promise<string> {
        return this._namesTextarea.inputValue();
    }

    /**
     * Fills in the title field.
     */
    public async fillTitle(title: string): Promise<void> {
        await this._titleInput.fill(title);
    }

    /**
     * Gets the current value of the title field.
     */
    public async getTitle(): Promise<string> {
        return this._titleInput.inputValue();
    }

    /**
     * Fills in the description field.
     */
    public async fillDescription(description: string): Promise<void> {
        await this._descriptionInput.fill(description);
    }

    /**
     * Gets the current value of the description field.
     */
    public async getDescription(): Promise<string> {
        return this._descriptionInput.inputValue();
    }

    /**
     * Toggles the "Randomize Order" switch.
     */
    public async toggleRandomizeOrder(): Promise<void> {
        await this._randomizeOrderSwitch.click();
    }

    /**
     * Gets the checked state of the "Randomize Order" switch.
     */
    public async isRandomizeOrderChecked(): Promise<boolean> {
        return this._randomizeOrderSwitch.isChecked();
    }

    /**
     * Toggles the "Show Names" switch.
     */
    public async toggleShowNames(): Promise<void> {
        await this._showNamesSwitch.click();
    }

    /**
     * Gets the checked state of the "Show Names" switch.
     */
    public async isShowNamesChecked(): Promise<boolean> {
        return this._showNamesSwitch.isChecked();
    }

    /**
     * Selects a wheel color scheme.
     * @param scheme - Color scheme to select (Monochromatic, Analogous, Custom, Random)
     */
    public async selectColorScheme(scheme: 'Monochromatic' | 'Analogous' | 'Custom' | 'Random'): Promise<void> {
        // HeroUI Select component - click to open dropdown, then click the option
        await this._wheelColorSelect.click();
        await this.page.getByRole('listbox').getByText(scheme, { exact: true }).click();
    }

    /**
     * Gets the currently selected color scheme.
     */
    public async getSelectedColorScheme(): Promise<string | null> {
        return this._wheelColorSelect.locator('[data-slot="value"]').textContent();
    }

    /**
     * Sets the base color using hex input.
     * @param hexColor - Hex color code (e.g., '#FF0000')
     */
    public async setBaseColor(hexColor: string): Promise<void> {
        await this._baseColorHexInput.fill(hexColor);
    }

    /**
     * Gets the current base color value.
     */
    public async getBaseColor(): Promise<string> {
        return this._baseColorHexInput.inputValue();
    }

    /**
     * Adds a custom color to the palette.
     * @param hexColor - Hex color code to add
     */
    public async addCustomColor(hexColor: string): Promise<void> {
        // Find the custom color hex input (should be in a new row after add)
        const colorInputs = this.page.locator('input[placeholder*="color" i]');
        const count = await colorInputs.count();
        if (count > 0) {
            await colorInputs.nth(count - 1).fill(hexColor);
        }
    }

    /**
     * Gets all custom colors currently in the palette.
     */
    public async getCustomColors(): Promise<string[]> {
        const colorButtons = this._customColorsContainer.locator('button');
        const count = await colorButtons.count();
        const colors: string[] = [];

        for (let i = 0; i < count; i++) {
            const style = await colorButtons.nth(i).getAttribute('style');
            if (style && style.includes('background')) {
                colors.push(style);
            }
        }

        return colors;
    }

    /**
     * Toggles the "Randomize Color Order" switch.
     */
    public async toggleRandomizeColor(): Promise<void> {
        await this._randomizeColorSwitch.click();
    }

    /**
     * Gets the checked state of the "Randomize Color Order" switch.
     */
    public async isRandomizeColorChecked(): Promise<boolean> {
        return this._randomizeColorSwitch.isChecked();
    }

    /**
     * Selects a page background color option.
     * @param option - Background option ('Default' or 'Single')
     */
    public async selectBackgroundColor(option: 'Night (Default)' | 'Single Color'): Promise<void> {
        // HeroUI Select component - click to open dropdown, then click the option
        await this._appBackgroundColorSelect.click();
        await this.page.getByRole('listbox').getByText(option, { exact: true }).click();
    }

    /**
     * Gets the currently selected background color option.
     */
    public async getSelectedBackgroundColor(): Promise<string | null> {
        return this._appBackgroundColorSelect.locator('[data-slot="value"]').textContent();
    }

    /**
     * Sets the page background color using hex input.
     * @param hexColor - Hex color code
     */
    public async setBackgroundColor(hexColor: string): Promise<void> {
        await this._backgroundColorHexInput.fill(hexColor);
    }

    /**
     * Gets the current background color value.
     */
    public async getBackgroundColor(): Promise<string> {
        return this._backgroundColorHexInput.inputValue();
    }

    /**
     * Clicks the "Create New Wheel" button.
     */
    public async clickCreateNewWheel(): Promise<void> {
        await this._createNewWheelButton.click();
    }

    /**
     * Clicks the "Update Existing Wheel" button.
     */
    public async clickUpdateWheel(): Promise<void> {
        await this._updateWheelButton.click();
    }

    /**
     * Clicks the "Reset Form" button.
     */
    public async clickResetForm(): Promise<void> {
        await this._resetFormButton.click();
    }

    /**
     * Checks if the "Create New Wheel" button is visible.
     */
    public async isCreateNewWheelButtonVisible(): Promise<boolean> {
        return this._createNewWheelButton.isVisible();
    }

    /**
     * Checks if the "Update Existing Wheel" button is visible.
     */
    public async isUpdateWheelButtonVisible(): Promise<boolean> {
        return this._updateWheelButton.isVisible();
    }

    /**
     * Toggles the wheel preview visibility.
     */
    public async togglePreview(): Promise<void> {
        await this._previewToggleButton.click();
    }

    /**
     * Checks if the wheel preview is visible.
     */
    public async isPreviewVisible(): Promise<boolean> {
        return this._wheelPreview.isVisible();
    }

    /**
     * Gets the page title.
     */
    public async getPageTitle(): Promise<string | null> {
        return this._pageTitle.textContent();
    }

    /**
     * Checks if the form is valid and can be submitted.
     */
    public async canSubmit(): Promise<boolean> {
        return this._createNewWheelButton.isEnabled();
    }
}
