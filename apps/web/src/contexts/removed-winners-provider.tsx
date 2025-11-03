import { type FC, type ReactNode, useMemo, useState } from 'react';
import { RemovedWinnersContext, defaultRemovedWinnersContextValue } from '@/contexts/removed-winners';

interface RemovedWinnersProviderProps {
    children: ReactNode;
}

/**
 * Provider component for the RemovedWinnersContext
 *
 * Manages the state of removed winners and provides it to child components
 *
 * @param props - The component props
 * @returns A context provider component
 */
export const RemovedWinnersProvider: FC<RemovedWinnersProviderProps> = ({ children }) => {
    // Initialize state with the default value from context
    const [removedWinners, setRemovedWinners] = useState<string[]>(defaultRemovedWinnersContextValue.removedWinners);

    const value = useMemo(() => ({ removedWinners, setRemovedWinners }), [removedWinners]);

    return <RemovedWinnersContext.Provider value={value}>{children}</RemovedWinnersContext.Provider>;
};
