import { Page } from '@playwright/test';

/**
 * Utility functions for testing localStorage interactions.
 */

/**
 * Saves data to localStorage via page context.
 */
export async function setLocalStorage(page: Page, key: string, value: string): Promise<void> {
    await page.evaluate(
        ({ key, value }) => {
            localStorage.setItem(key, value);
        },
        { key, value }
    );
}

/**
 * Retrieves data from localStorage.
 */
export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
    return page.evaluate((key) => localStorage.getItem(key), key);
}

/**
 * Clears all localStorage data.
 * Must be called after navigating to a page to avoid security errors.
 */
export async function clearLocalStorage(page: Page): Promise<void> {
    await page.evaluate(() => {
        localStorage.clear();
    });
}

/**
 * Removes a specific key from localStorage.
 */
export async function removeLocalStorageKey(page: Page, key: string): Promise<void> {
    await page.evaluate((key) => {
        localStorage.removeItem(key);
    }, key);
}

/**
 * Gets all localStorage data as an object.
 */
export async function getAllLocalStorage(page: Page): Promise<Record<string, string>> {
    return page.evaluate(() => {
        const result: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                result[key] = localStorage.getItem(key) || '';
            }
        }
        return result;
    });
}

/**
 * Simulates storage quota exceeded by mocking localStorage.setItem.
 * Must be called before navigating to the page under test.
 */
export async function mockStorageQuotaExceeded(page: Page): Promise<void> {
    await page.evaluate(() => {
        Storage.prototype.setItem = function () {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        };
    });
}

/**
 * Corrupts localStorage data for error testing.
 */
export async function corruptLocalStorage(page: Page, key: string): Promise<void> {
    await page.evaluate((key) => {
        localStorage.setItem(key, 'CORRUPTED_DATA_NOT_JSON{invalid');
    }, key);
}

/**
 * Gets the size of localStorage data in bytes.
 */
export async function getLocalStorageSize(page: Page): Promise<number> {
    return page.evaluate(() => {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key) || '';
                totalSize += key.length + value.length;
            }
        }
        return totalSize;
    });
}

/**
 * Creates a sample saved wheel entry in localStorage.
 */
export async function createSavedWheelEntry(
    page: Page,
    wheelId: string,
    title: string,
    encodedConfig: string
): Promise<void> {
    const savedWheels = await getLocalStorage(page, 'savedWheels');
    let wheels: Record<string, unknown> = {};

    if (savedWheels) {
        try {
            wheels = JSON.parse(savedWheels);
        } catch {
            wheels = {};
        }
    }

    wheels[wheelId] = {
        id: wheelId,
        title,
        description: 'Test wheel',
        encodedConfig,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    await setLocalStorage(page, 'savedWheels', JSON.stringify(wheels));
}

/**
 * Creates multiple saved wheel entries.
 */
export async function createMultipleSavedWheels(
    page: Page,
    wheels: { id: string; title: string; encodedConfig: string }[]
): Promise<void> {
    const savedWheels: Record<string, unknown> = {};

    for (const wheel of wheels) {
        savedWheels[wheel.id] = {
            id: wheel.id,
            title: wheel.title,
            description: 'Test wheel',
            encodedConfig: wheel.encodedConfig,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    await setLocalStorage(page, 'savedWheels', JSON.stringify(savedWheels));
}

/**
 * Gets saved wheels from localStorage as parsed objects.
 */
export async function getSavedWheels(page: Page): Promise<Record<string, unknown>> {
    const data = await getLocalStorage(page, 'savedWheels');
    if (!data) return {};

    try {
        return JSON.parse(data);
    } catch {
        return {};
    }
}
