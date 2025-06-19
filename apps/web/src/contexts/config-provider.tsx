import { Config } from '@repo/shared/classes/config';
import { type FC, type ReactNode, useState } from 'react';
import { ConfigContext, defaultConfigContextValue } from '@/contexts/config';

interface ConfigProviderProps {
    children: ReactNode;
}

export const ConfigProvider: FC<ConfigProviderProps> = ({ children }) => {
    const [decodedConfig, setDecodedConfig] = useState<Config | undefined>(defaultConfigContextValue.decodedConfig);
    const [encodedConfig, setEncodedConfig] = useState<string | undefined>(defaultConfigContextValue.encodedConfig);

    return (
        <ConfigContext.Provider value={{ decodedConfig, setDecodedConfig, encodedConfig, setEncodedConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};
