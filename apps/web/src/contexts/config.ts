import { Config } from '@repo/shared/classes/config';
import { type Dispatch, type SetStateAction, createContext, useContext } from 'react';

interface ConfigContextValue {
    decodedConfig: Config | undefined;
    encodedConfig: string | undefined;
    setDecodedConfig: Dispatch<SetStateAction<Config | undefined>>;
    setEncodedConfig: Dispatch<SetStateAction<string | undefined>>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

/**
 * Hook to access the Config context.
 * Must be used within a ConfigProvider.
 * @throws Error if used outside of ConfigProvider
 */
export function useConfig(): ConfigContextValue {
    const context = useContext(ConfigContext);
    if (!context) {
        throw new Error('useConfig must be used within ConfigProvider');
    }
    return context;
}

export { ConfigContext };
