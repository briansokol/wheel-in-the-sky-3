import { Config } from '@repo/shared/classes/config';
import { decodeConfig } from '@repo/shared/utils/encoding';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDecodedConfig } from '../config';

vi.mock('@repo/shared/utils/encoding', () => ({ decodeConfig: vi.fn() }));

describe('useDecodedConfig', () => {
    afterEach(() => {
        vi.mocked(decodeConfig).mockReset();
    });

    it('returns a new config for "new" without decoding', async () => {
        const { result } = renderHook(() => useDecodedConfig('new'));
        await waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.data).toBeInstanceOf(Config);
        expect(decodeConfig).not.toHaveBeenCalled();
    });

    it('stays pending for undefined', async () => {
        const { result } = renderHook(() => useDecodedConfig(undefined));
        await act(async () => {});
        expect(result.current.isPending).toBe(true);
        expect(decodeConfig).not.toHaveBeenCalled();
    });

    it('returns the decoded config', async () => {
        const config = new Config();
        vi.mocked(decodeConfig).mockResolvedValue(config);
        const { result } = renderHook(() => useDecodedConfig('v5.abc'));
        await waitFor(() => expect(result.current.data).toBe(config));
        expect(result.current.isError).toBe(false);
        expect(decodeConfig).toHaveBeenCalledWith('v5.abc');
    });

    it('reports an error', async () => {
        vi.mocked(decodeConfig).mockRejectedValue(new Error('Invalid config'));
        const { result } = renderHook(() => useDecodedConfig('v5.bad'));
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.data).toBeUndefined();
        expect(result.current.isPending).toBe(false);
    });

    it('ignores a stale result when the input changes', async () => {
        const configA = new Config();
        const configB = new Config();
        let resolveA: ((config: Config) => void) | undefined;
        vi.mocked(decodeConfig).mockImplementation((encoded: string) =>
            encoded === 'a'
                ? new Promise<Config>((resolve) => {
                      resolveA = resolve;
                  })
                : Promise.resolve(configB)
        );

        const { result, rerender } = renderHook(({ encoded }) => useDecodedConfig(encoded), {
            initialProps: { encoded: 'a' },
        });
        rerender({ encoded: 'b' });
        await waitFor(() => expect(result.current.data).toBe(configB));

        await act(async () => resolveA?.(configA));
        expect(result.current.data).toBe(configB);
    });
});
