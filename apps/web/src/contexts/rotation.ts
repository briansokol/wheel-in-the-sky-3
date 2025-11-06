import { type Dispatch, type SetStateAction, createContext, useContext } from 'react';

interface RotationContextValue {
    rotation: number;
    setRotation: Dispatch<SetStateAction<number>>;
}

const RotationContext = createContext<RotationContextValue | undefined>(undefined);

/**
 * Hook to access the Rotation context.
 * Must be used within a RotationProvider.
 * @throws Error if used outside of RotationProvider
 */
export function useRotation(): RotationContextValue {
    const context = useContext(RotationContext);
    if (!context) {
        throw new Error('useRotation must be used within RotationProvider');
    }
    return context;
}

export { RotationContext };
