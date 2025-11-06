import { type FC, type ReactNode, useMemo, useState } from 'react';
import { RotationContext } from '@/contexts/rotation';

interface RotationProviderProps {
    children: ReactNode;
}

export const RotationProvider: FC<RotationProviderProps> = ({ children }) => {
    const [rotation, setRotation] = useState<number>(0);

    const value = useMemo(() => ({ rotation, setRotation }), [rotation]);

    return <RotationContext.Provider value={value}>{children}</RotationContext.Provider>;
};
