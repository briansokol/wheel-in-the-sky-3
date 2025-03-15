import { Segment } from '@repo/shared/classes/segment';
import { type FC, type ReactNode, useState } from 'react';
import { SegmentContext, defaultSegmentContextValue } from '@/contexts/segment';

interface SegmentProviderProps {
    children: ReactNode;
}

export const SegmentProvider: FC<SegmentProviderProps> = ({ children }) => {
    const [segment, setSegment] = useState<Segment | undefined>(defaultSegmentContextValue.segment);
    const [hasWinner, setHasWinner] = useState<boolean>(defaultSegmentContextValue.hasWinner);

    return (
        <SegmentContext.Provider value={{ segment, hasWinner, setSegment, setHasWinner }}>
            {children}
        </SegmentContext.Provider>
    );
};
