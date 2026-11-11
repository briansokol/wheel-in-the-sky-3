import { Config } from '@repo/shared/classes/config';
import { ConfigFormInputs } from '@repo/shared/types/config';
import { decodeConfig } from '@repo/shared/utils/encoding';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '@/utils/api';

interface DecodedConfigResult {
    data: Config | undefined;
    isError: boolean;
    isPending: boolean;
}

interface DecodeState {
    input: string | undefined;
    data: Config | undefined;
    isError: boolean;
}

/**
 * Decodes a share-link config in the browser. `'new'` (any case) yields a blank
 * config, and `undefined` stays pending without decoding.
 */
export function useDecodedConfig(encodedConfig?: string): DecodedConfigResult {
    const [state, setState] = useState<DecodeState>({ input: undefined, data: undefined, isError: false });

    useEffect(() => {
        if (encodedConfig === undefined) {
            return;
        }

        let cancelled = false;
        const decoded =
            encodedConfig.toLowerCase() === 'new' ? Promise.resolve(new Config()) : decodeConfig(encodedConfig);
        decoded.then(
            (data) => {
                if (!cancelled) setState({ input: encodedConfig, data, isError: false });
            },
            () => {
                if (!cancelled) setState({ input: encodedConfig, data: undefined, isError: true });
            }
        );

        return () => {
            cancelled = true;
        };
    }, [encodedConfig]);

    const isPending = encodedConfig === undefined || state.input !== encodedConfig;
    return {
        data: isPending ? undefined : state.data,
        isError: !isPending && state.isError,
        isPending,
    };
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
