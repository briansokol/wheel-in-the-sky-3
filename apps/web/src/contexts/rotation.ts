import { type Dispatch, type SetStateAction, createContext } from 'react';

interface RotationContextValue {
    rotation: number;
    setRotation?: Dispatch<SetStateAction<number>>;
}

export const defaultRotationContextValue: RotationContextValue = {
    rotation: 0,
    setRotation: undefined,
};

export const RotationContext = createContext<RotationContextValue>(defaultRotationContextValue);
