import { Segment } from '@repo/shared/classes/segment';
import { type Dispatch, type SetStateAction, createContext, useContext } from 'react';

interface SegmentContextValue {
    segment: Segment | undefined;
    hasWinner: boolean;
    setSegment: Dispatch<SetStateAction<Segment | undefined>>;
    setHasWinner: Dispatch<SetStateAction<boolean>>;
}

const SegmentContext = createContext<SegmentContextValue | undefined>(undefined);

/**
 * Hook to access the Segment context.
 * Must be used within a SegmentProvider.
 * @throws Error if used outside of SegmentProvider
 */
export function useSegment(): SegmentContextValue {
    const context = useContext(SegmentContext);
    if (!context) {
        throw new Error('useSegment must be used within SegmentProvider');
    }
    return context;
}

export { SegmentContext };
