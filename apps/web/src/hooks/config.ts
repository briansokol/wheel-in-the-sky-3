import { Config } from '@repo/shared/classes/config';
import { ConfigFormInputs } from '@repo/shared/types/config';
import { type UseQueryResult, useMutation, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '@/utils/api';

export function useDecodedConfig(encodedConfig?: string): UseQueryResult<Config | undefined> {
    return useQuery({
        queryKey: ['decodeConfig', encodedConfig],
        queryFn: async ({ queryKey }): Promise<Config | undefined> => {
            const [, encodedConfig] = queryKey;
            let newConfig: Config | undefined;

            if (typeof encodedConfig === 'string' && encodedConfig.toLowerCase() !== 'new') {
                const response = await api.config.decode.$post({
                    json: {
                        encodedConfig,
                    },
                });
                if (response.ok) {
                    const configJson = await response.json();
                    newConfig = new Config().deserialize(configJson);
                } else {
                    throw new Error('Failed to decode config');
                }
            } else if (typeof encodedConfig === 'string' && encodedConfig.toLowerCase() === 'new') {
                newConfig = new Config();
            }

            return newConfig;
        },
        retry: 1,
        staleTime: 1000 * 60 * 15,
    });
}

export function useEncodeConfigMutation() {
    return useMutation({
        mutationFn: async (config: ConfigFormInputs) => {
            const response = await api.config.encode.$post({
                json: config,
            });
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error('Failed to encode config');
            }
        },
        retry: 1,
    });
}

export function useValidConfigCheck(id: string | undefined, isError: boolean) {
    const navigate = useNavigate();

    useEffect(() => {
        if (id === undefined || isError) {
            navigate('/config/v3/new');
        }
    }, [id, isError, navigate]);
}
