import { Config } from '@repo/shared/classes/config';
import { type FC, type ReactNode, useMemo, useState } from 'react';
import { ConfigContext } from '@/contexts/config';

interface ConfigProviderProps {
    children: ReactNode;
}

export const ConfigProvider: FC<ConfigProviderProps> = ({ children }) => {
    const [decodedConfig, setDecodedConfig] = useState<Config | undefined>(undefined);
    const [encodedConfig, setEncodedConfig] = useState<string | undefined>(undefined);

    const value = useMemo(
        () => ({ decodedConfig, setDecodedConfig, encodedConfig, setEncodedConfig }),
        [decodedConfig, encodedConfig]
    );

    return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};
