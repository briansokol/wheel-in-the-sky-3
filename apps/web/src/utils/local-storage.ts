import { Config } from '@repo/shared/classes/config';
import { useCallback, useEffect, useState } from 'react';

const WHEEL_STORAGE_KEY = 'savedWheels';

interface SavedWheel {
    id: string;
    title: string;
    description?: string;
    encodedConfig: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Retrieves saved wheels from local storage.
 * A dictionary of saved wheels where the key is wheel ID and the value is the wheel data.
 */
type SavedWheels = Record<string, SavedWheel>;

export function getSavedWheels(): SavedWheels {
    const savedWheels = localStorage.getItem(WHEEL_STORAGE_KEY);
    return savedWheels ? JSON.parse(savedWheels) : {};
}

export function useSavedWheels() {
    const [savedWheels, setSavedWheels] = useState<SavedWheel[]>(Object.values(getSavedWheels()));

    const saveWheel = useCallback(
        (decodedConfig?: Config, encodedConfig?: string) => {
            if (decodedConfig && encodedConfig && encodedConfig !== 'new') {
                const savedWheels = getSavedWheels();

                const wheelId = decodedConfig.id;
                const currentTime = new Date().toISOString();

                savedWheels[wheelId] = {
                    id: wheelId,
                    title: decodedConfig.title || decodedConfig.names.join(', ').substring(0, 100),
                    description: decodedConfig.description || undefined,
                    encodedConfig,
                    createdAt: savedWheels[wheelId]?.createdAt || currentTime,
                    updatedAt: currentTime,
                };

                localStorage.setItem(WHEEL_STORAGE_KEY, JSON.stringify(savedWheels));
                setSavedWheels(Object.values(savedWheels));
            }
        },
        [setSavedWheels]
    );

    const updateWheelIfSaved = useCallback(
        (decodedConfig?: Config, encodedConfig?: string) => {
            if (saveWheel) {
                if (decodedConfig) {
                    const savedWheels = getSavedWheels();

                    const wheelId = decodedConfig.id;

                    if (savedWheels[wheelId] && savedWheels[wheelId].encodedConfig !== encodedConfig) {
                        saveWheel(decodedConfig, encodedConfig);
                    }
                }
            }
        },
        [saveWheel]
    );

    const removeSavedWheel = useCallback((wheelId: string) => {
        const savedWheels = getSavedWheels();
        if (wheelId in savedWheels) {
            const { [wheelId]: _unused, ...newWheels } = savedWheels; // eslint-disable-line @typescript-eslint/no-unused-vars
            localStorage.setItem(WHEEL_STORAGE_KEY, JSON.stringify(newWheels));
            setSavedWheels(Object.values(newWheels));
        } else {
            console.warn(`Wheel with ID ${wheelId} does not exist in saved wheels.`);
        }
    }, []);

    const getSavedWheelArray = useCallback((newValue: string | null) => {
        const updatedWheels: SavedWheels = newValue ? JSON.parse(newValue) : {};
        setSavedWheels(Object.values(updatedWheels));
    }, []);

    const getSavedWheelsEvent = useCallback(
        (event: StorageEvent) => {
            if (event.storageArea === localStorage && event.key === WHEEL_STORAGE_KEY) {
                getSavedWheelArray(event.newValue);
            }
        },
        [getSavedWheelArray]
    );

    useEffect(() => {
        window.addEventListener('storage', getSavedWheelsEvent);
        return () => {
            window.removeEventListener('storage', getSavedWheelsEvent);
        };
    }, [getSavedWheelsEvent]);

    return { savedWheels, saveWheel, removeSavedWheel, updateWheelIfSaved };
}
