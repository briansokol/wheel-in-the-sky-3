import { Config } from '@repo/shared/classes/config';
import { type Dispatch, type SetStateAction, createContext } from 'react';

interface ConfigContextValue {
    decodedConfig?: Config;
    encodedConfig?: string;
    setDecodedConfig?: Dispatch<SetStateAction<Config | undefined>>;
    setEncodedConfig?: Dispatch<SetStateAction<string | undefined>>;
}

export const defaultConfigContextValue: ConfigContextValue = {
    decodedConfig: undefined,
    encodedConfig: undefined,
    setDecodedConfig: undefined,
    setEncodedConfig: undefined,
};

export const ConfigContext = createContext<ConfigContextValue>(defaultConfigContextValue);
