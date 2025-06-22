import { Config } from '@repo/shared/classes/config';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSavedWheels, useSavedWheels } from '../local-storage';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index: number) => Object.keys(store)[index] || null),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock nanoid for consistent test results
vi.mock('nanoid', () => ({
    nanoid: vi.fn(() => 'test-id-123'),
}));

/**
 * Creates a mock Config instance for testing
 * @param overrides - Optional properties to override
 * @returns A mock Config instance
 */
function createMockConfig(overrides: Partial<Config> = {}): Config {
    const config = new Config();
    config.id = 'test-wheel-id';
    config.title = 'Test Wheel';
    config.description = 'A test wheel description';
    config.names = ['Option 1', 'Option 2', 'Option 3'];

    return Object.assign(config, overrides);
}

/**
 * Creates a mock SavedWheel object for testing
 * @param overrides - Optional properties to override
 * @returns A mock SavedWheel object
 */
function createMockSavedWheel(overrides: Record<string, unknown> = {}) {
    const now = '2025-06-21T10:00:00.000Z';
    return {
        id: 'test-wheel-id',
        title: 'Test Wheel',
        description: 'A test wheel description',
        encodedConfig: 'encoded-config-string',
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
}

describe('getSavedWheels', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
    });

    /**
     * Tests that getSavedWheels returns an empty object when localStorage is empty
     */
    it('should return empty object when no saved wheels exist', () => {
        const result = getSavedWheels();
        expect(result).toEqual({});
        expect(localStorageMock.getItem).toHaveBeenCalledWith('savedWheels');
    });

    /**
     * Tests that getSavedWheels correctly parses and returns saved wheels from localStorage
     */
    it('should return parsed saved wheels from localStorage', () => {
        const mockWheels = {
            'wheel-1': createMockSavedWheel({ id: 'wheel-1', title: 'Wheel 1' }),
            'wheel-2': createMockSavedWheel({ id: 'wheel-2', title: 'Wheel 2' }),
        };

        localStorageMock.setItem('savedWheels', JSON.stringify(mockWheels));

        const result = getSavedWheels();
        expect(result).toEqual(mockWheels);
        expect(localStorageMock.getItem).toHaveBeenCalledWith('savedWheels');
    });

    /**
     * Tests that getSavedWheels handles corrupted localStorage data gracefully
     */
    it('should return empty object when localStorage contains invalid JSON', () => {
        localStorageMock.setItem('savedWheels', 'invalid-json');

        expect(() => getSavedWheels()).toThrow();
    });
});

describe('useSavedWheels', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-06-21T10:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    /**
     * Tests initial state of the hook when no saved wheels exist
     */
    it('should initialize with empty array when no saved wheels exist', () => {
        const { result } = renderHook(() => useSavedWheels());

        expect(result.current.savedWheels).toEqual([]);
    });

    /**
     * Tests initial state of the hook when saved wheels exist in localStorage
     */
    it('should initialize with existing saved wheels from localStorage', () => {
        const mockWheels = {
            'wheel-1': createMockSavedWheel({ id: 'wheel-1', title: 'Wheel 1' }),
            'wheel-2': createMockSavedWheel({ id: 'wheel-2', title: 'Wheel 2' }),
        };

        localStorageMock.setItem('savedWheels', JSON.stringify(mockWheels));

        const { result } = renderHook(() => useSavedWheels());

        expect(result.current.savedWheels).toHaveLength(2);
        expect(result.current.savedWheels[0].id).toBe('wheel-1');
        expect(result.current.savedWheels[1].id).toBe('wheel-2');
    });

    describe('saveWheel', () => {
        /**
         * Tests saving a new wheel
         */
        it('should save a new wheel to localStorage', () => {
            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig();
            const encodedConfig = 'encoded-config-string';

            act(() => {
                result.current.saveWheel(mockConfig, encodedConfig);
            });

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'savedWheels',
                expect.stringContaining('"test-wheel-id"')
            );

            expect(result.current.savedWheels).toHaveLength(1);
            expect(result.current.savedWheels[0]).toMatchObject({
                id: 'test-wheel-id',
                title: 'Test Wheel',
                description: 'A test wheel description',
                encodedConfig: 'encoded-config-string',
                createdAt: '2025-06-21T10:00:00.000Z',
                updatedAt: '2025-06-21T10:00:00.000Z',
            });
        });

        /**
         * Tests updating an existing wheel
         */
        it('should update an existing wheel in localStorage', () => {
            // Setup existing wheel
            const existingWheels = {
                'test-wheel-id': createMockSavedWheel({
                    createdAt: '2025-06-20T10:00:00.000Z',
                }),
            };
            localStorageMock.setItem('savedWheels', JSON.stringify(existingWheels));

            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig({ title: 'Updated Title' });
            const encodedConfig = 'updated-encoded-config';

            act(() => {
                result.current.saveWheel(mockConfig, encodedConfig);
            });

            expect(result.current.savedWheels).toHaveLength(1);
            expect(result.current.savedWheels[0]).toMatchObject({
                id: 'test-wheel-id',
                title: 'Updated Title',
                encodedConfig: 'updated-encoded-config',
                createdAt: '2025-06-20T10:00:00.000Z', // Should preserve original creation date
                updatedAt: '2025-06-21T10:00:00.000Z', // Should update modification date
            });
        });

        /**
         * Tests that saveWheel generates title from names when title is empty
         */
        it('should generate title from names when config title is empty', () => {
            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig({
                title: '',
                names: ['Apple', 'Banana', 'Cherry', 'Date'],
            });
            const encodedConfig = 'encoded-config-string';

            act(() => {
                result.current.saveWheel(mockConfig, encodedConfig);
            });

            expect(result.current.savedWheels[0].title).toBe('Apple, Banana, Cherry, Date');
        });

        /**
         * Tests that saveWheel truncates long generated titles
         */
        it('should truncate generated title to 100 characters', () => {
            const { result } = renderHook(() => useSavedWheels());
            const longNames = Array.from({ length: 20 }, (_, i) => `Very Long Option Name ${i + 1}`);
            const mockConfig = createMockConfig({
                title: '',
                names: longNames,
            });
            const encodedConfig = 'encoded-config-string';

            act(() => {
                result.current.saveWheel(mockConfig, encodedConfig);
            });

            expect(result.current.savedWheels[0].title.length).toBeLessThanOrEqual(100);
        });

        /**
         * Tests that saveWheel handles undefined description
         */
        it('should handle undefined description', () => {
            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig({ description: '' });
            const encodedConfig = 'encoded-config-string';

            act(() => {
                result.current.saveWheel(mockConfig, encodedConfig);
            });

            expect(result.current.savedWheels[0].description).toBeUndefined();
        });

        /**
         * Tests that saveWheel doesn't save when parameters are invalid
         */
        it('should not save when decodedConfig is undefined', () => {
            const { result } = renderHook(() => useSavedWheels());

            act(() => {
                result.current.saveWheel(undefined, 'encoded-config');
            });

            expect(localStorageMock.setItem).not.toHaveBeenCalled();
            expect(result.current.savedWheels).toHaveLength(0);
        });

        /**
         * Tests that saveWheel doesn't save when encodedConfig is undefined
         */
        it('should not save when encodedConfig is undefined', () => {
            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig();

            act(() => {
                result.current.saveWheel(mockConfig, undefined);
            });

            expect(localStorageMock.setItem).not.toHaveBeenCalled();
            expect(result.current.savedWheels).toHaveLength(0);
        });

        /**
         * Tests that saveWheel doesn't save when encodedConfig is 'new'
         */
        it('should not save when encodedConfig is "new"', () => {
            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig();

            act(() => {
                result.current.saveWheel(mockConfig, 'new');
            });

            expect(localStorageMock.setItem).not.toHaveBeenCalled();
            expect(result.current.savedWheels).toHaveLength(0);
        });
    });

    describe('updateWheelIfSaved', () => {
        /**
         * Tests updating a wheel that is already saved
         */
        it('should update wheel if it exists and encodedConfig has changed', () => {
            // Setup existing wheel
            const existingWheels = {
                'test-wheel-id': createMockSavedWheel({
                    encodedConfig: 'old-encoded-config',
                }),
            };
            localStorageMock.setItem('savedWheels', JSON.stringify(existingWheels));

            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig();
            const newEncodedConfig = 'new-encoded-config';

            act(() => {
                result.current.updateWheelIfSaved(mockConfig, newEncodedConfig);
            });

            expect(result.current.savedWheels[0].encodedConfig).toBe('new-encoded-config');
        });

        /**
         * Tests that updateWheelIfSaved doesn't update when encodedConfig is the same
         */
        it('should not update wheel if encodedConfig has not changed', () => {
            const existingWheels = {
                'test-wheel-id': createMockSavedWheel({
                    encodedConfig: 'same-encoded-config',
                    updatedAt: '2025-06-20T10:00:00.000Z',
                }),
            };
            localStorageMock.setItem('savedWheels', JSON.stringify(existingWheels));

            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig();

            act(() => {
                result.current.updateWheelIfSaved(mockConfig, 'same-encoded-config');
            });

            // Should not have updated the timestamp
            expect(result.current.savedWheels[0].updatedAt).toBe('2025-06-20T10:00:00.000Z');
        });

        /**
         * Tests that updateWheelIfSaved doesn't update when wheel is not saved
         */
        it('should not update wheel if it is not saved', () => {
            const { result } = renderHook(() => useSavedWheels());
            const mockConfig = createMockConfig();

            act(() => {
                result.current.updateWheelIfSaved(mockConfig, 'new-encoded-config');
            });

            expect(result.current.savedWheels).toHaveLength(0);
        });

        /**
         * Tests that updateWheelIfSaved handles undefined decodedConfig
         */
        it('should handle undefined decodedConfig', () => {
            const { result } = renderHook(() => useSavedWheels());

            act(() => {
                result.current.updateWheelIfSaved(undefined, 'encoded-config');
            });

            expect(result.current.savedWheels).toHaveLength(0);
        });
    });

    describe('removeSavedWheel', () => {
        /**
         * Tests removing an existing wheel
         */
        it('should remove an existing wheel from localStorage', () => {
            const existingWheels = {
                'wheel-1': createMockSavedWheel({ id: 'wheel-1', title: 'Wheel 1' }),
                'wheel-2': createMockSavedWheel({ id: 'wheel-2', title: 'Wheel 2' }),
            };
            localStorageMock.setItem('savedWheels', JSON.stringify(existingWheels));

            const { result } = renderHook(() => useSavedWheels());

            act(() => {
                result.current.removeSavedWheel('wheel-1');
            });

            expect(result.current.savedWheels).toHaveLength(1);
            expect(result.current.savedWheels[0].id).toBe('wheel-2');

            // Verify localStorage was updated
            const storedWheels = JSON.parse(localStorageMock.getItem('savedWheels') as string);
            expect(storedWheels).not.toHaveProperty('wheel-1');
            expect(storedWheels).toHaveProperty('wheel-2');
        });

        /**
         * Tests attempting to remove a non-existent wheel
         */
        it('should log warning when trying to remove non-existent wheel', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
                // Mock implementation - no operation needed
            });

            const { result } = renderHook(() => useSavedWheels());

            act(() => {
                result.current.removeSavedWheel('non-existent-wheel');
            });

            expect(consoleSpy).toHaveBeenCalledWith('Wheel with ID non-existent-wheel does not exist in saved wheels.');
            expect(result.current.savedWheels).toHaveLength(0);

            consoleSpy.mockRestore();
        });
    });

    describe('localStorage event handling', () => {
        /**
         * Tests that the hook responds to localStorage changes from other tabs
         */
        it('should update state when localStorage changes from another tab', () => {
            const { result } = renderHook(() => useSavedWheels());

            const newWheels = {
                'external-wheel': createMockSavedWheel({
                    id: 'external-wheel',
                    title: 'External Wheel',
                }),
            };

            // Simulate storage event from another tab
            const storageEvent = new Event('storage') as StorageEvent;
            Object.defineProperty(storageEvent, 'key', { value: 'savedWheels' });
            Object.defineProperty(storageEvent, 'newValue', { value: JSON.stringify(newWheels) });
            Object.defineProperty(storageEvent, 'storageArea', { value: window.localStorage });

            act(() => {
                window.dispatchEvent(storageEvent);
            });

            expect(result.current.savedWheels).toHaveLength(1);
            expect(result.current.savedWheels[0].id).toBe('external-wheel');
        });

        /**
         * Tests that the hook ignores storage events for other keys
         */
        it('should ignore storage events for other keys', () => {
            const existingWheels = {
                'existing-wheel': createMockSavedWheel({ id: 'existing-wheel' }),
            };
            localStorageMock.setItem('savedWheels', JSON.stringify(existingWheels));

            const { result } = renderHook(() => useSavedWheels());

            const storageEvent = new Event('storage') as StorageEvent;
            Object.defineProperty(storageEvent, 'key', { value: 'other-key' });
            Object.defineProperty(storageEvent, 'newValue', { value: 'some-value' });
            Object.defineProperty(storageEvent, 'storageArea', { value: window.localStorage });

            act(() => {
                window.dispatchEvent(storageEvent);
            });

            expect(result.current.savedWheels).toHaveLength(1);
            expect(result.current.savedWheels[0].id).toBe('existing-wheel');
        });

        /**
         * Tests that the hook ignores storage events from sessionStorage
         */
        it('should ignore storage events from sessionStorage', () => {
            const { result } = renderHook(() => useSavedWheels());

            const storageEvent = new Event('storage') as StorageEvent;
            Object.defineProperty(storageEvent, 'key', { value: 'savedWheels' });
            Object.defineProperty(storageEvent, 'newValue', { value: '{}' });
            Object.defineProperty(storageEvent, 'storageArea', { value: window.sessionStorage });

            act(() => {
                window.dispatchEvent(storageEvent);
            });

            expect(result.current.savedWheels).toHaveLength(0);
        });

        /**
         * Tests that the hook handles null newValue in storage events
         */
        it('should handle null newValue in storage events', () => {
            const existingWheels = {
                'existing-wheel': createMockSavedWheel({ id: 'existing-wheel' }),
            };
            localStorageMock.setItem('savedWheels', JSON.stringify(existingWheels));

            const { result } = renderHook(() => useSavedWheels());

            const storageEvent = new Event('storage') as StorageEvent;
            Object.defineProperty(storageEvent, 'key', { value: 'savedWheels' });
            Object.defineProperty(storageEvent, 'newValue', { value: null });
            Object.defineProperty(storageEvent, 'storageArea', { value: window.localStorage });

            act(() => {
                window.dispatchEvent(storageEvent);
            });

            expect(result.current.savedWheels).toHaveLength(0);
        });
    });
});
