import { type Dispatch, type SetStateAction, createContext } from 'react';

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
    setRemovedWinners?: Dispatch<SetStateAction<string[]>>;
}

/**
 * Default value for the RemovedWinnersContext
 */
export const defaultRemovedWinnersContextValue: RemovedWinnersContextValue = {
    removedWinners: [],
    setRemovedWinners: undefined,
};

/**
 * Context for tracking winners that have been removed from consideration
 */
export const RemovedWinnersContext = createContext<RemovedWinnersContextValue>(defaultRemovedWinnersContextValue);
