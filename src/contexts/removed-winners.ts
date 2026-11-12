import { type Dispatch, type SetStateAction, createContext, useContext } from 'react';

/**
 * Interface defining the shape of the RemovedWinnersContext value
 */
interface RemovedWinnersContextValue {
    /**
     * Array of removed winners
     */
    removedWinners: string[];

    /**
     * Function to update the removed winners array
     */
    setRemovedWinners: Dispatch<SetStateAction<string[]>>;
}

/**
 * Context for tracking winners that have been removed from consideration
 */
const RemovedWinnersContext = createContext<RemovedWinnersContextValue | undefined>(undefined);

/**
 * Hook to access the RemovedWinners context.
 * Must be used within a RemovedWinnersProvider.
 * @throws Error if used outside of RemovedWinnersProvider
 */
export function useRemovedWinners(): RemovedWinnersContextValue {
    const context = useContext(RemovedWinnersContext);
    if (!context) {
        throw new Error('useRemovedWinners must be used within RemovedWinnersProvider');
    }
    return context;
}

export { RemovedWinnersContext };
