import { Segment } from '@repo/shared/classes/segment';
import { type FC, type ReactNode, useMemo, useState } from 'react';
import { SegmentContext } from '@/contexts/segment';

interface SegmentProviderProps {
    children: ReactNode;
}

export const SegmentProvider: FC<SegmentProviderProps> = ({ children }) => {
    const [segment, setSegment] = useState<Segment | undefined>(undefined);
    const [hasWinner, setHasWinner] = useState<boolean>(false);

    const value = useMemo(() => ({ segment, hasWinner, setSegment, setHasWinner }), [segment, hasWinner]);

    return <SegmentContext.Provider value={value}>{children}</SegmentContext.Provider>;
};
