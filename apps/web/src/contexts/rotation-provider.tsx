import { type FC, type ReactNode, useState } from 'react';
import { RotationContext, defaultRotationContextValue } from '@/contexts/rotation';

interface RotationProviderProps {
    children: ReactNode;
}

export const RotationProvider: FC<RotationProviderProps> = ({ children }) => {
    const [rotation, setRotation] = useState<number>(defaultRotationContextValue.rotation);

    return <RotationContext.Provider value={{ rotation, setRotation }}>{children}</RotationContext.Provider>;
};
