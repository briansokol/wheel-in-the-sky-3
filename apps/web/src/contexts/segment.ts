import { Segment } from '@repo/shared/classes/segment';
import { type Dispatch, type SetStateAction, createContext } from 'react';

interface SegmentContextValue {
    segment?: Segment;
    hasWinner: boolean;
    setSegment?: Dispatch<SetStateAction<Segment | undefined>>;
    setHasWinner?: Dispatch<SetStateAction<boolean>>;
}

export const defaultSegmentContextValue: SegmentContextValue = {
    segment: undefined,
    hasWinner: false,
    setSegment: undefined,
    setHasWinner: undefined,
};

export const SegmentContext = createContext<SegmentContextValue>(defaultSegmentContextValue);
