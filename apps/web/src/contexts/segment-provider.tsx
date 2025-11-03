import { Segment } from '@repo/shared/classes/segment';
import { type FC, type ReactNode, useMemo, useState } from 'react';
import { SegmentContext, defaultSegmentContextValue } from '@/contexts/segment';

interface SegmentProviderProps {
    children: ReactNode;
}

export const SegmentProvider: FC<SegmentProviderProps> = ({ children }) => {
    const [segment, setSegment] = useState<Segment | undefined>(defaultSegmentContextValue.segment);
    const [hasWinner, setHasWinner] = useState<boolean>(defaultSegmentContextValue.hasWinner);

    const value = useMemo(() => ({ segment, hasWinner, setSegment, setHasWinner }), [segment, hasWinner]);

    return <SegmentContext.Provider value={value}>{children}</SegmentContext.Provider>;
};
