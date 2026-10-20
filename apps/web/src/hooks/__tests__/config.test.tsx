import { Config } from '@repo/shared/classes/config';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDecodedConfig } from '../config';

const { decodePost } = vi.hoisted(() => ({ decodePost: vi.fn() }));

vi.mock('@/utils/api', () => ({
    api: { config: { decode: { $post: decodePost } } },
}));

describe('useDecodedConfig', () => {
    afterEach(() => {
        vi.useRealTimers();
        focusManager.setFocused(undefined);
        decodePost.mockReset();
    });

    it('does not refetch on window focus long after the first decode', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        decodePost.mockResolvedValue({ ok: true, json: async () => new Config().serialize() });
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        );

        const { result } = renderHook(() => useDecodedConfig('abc'), { wrapper });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        vi.setSystemTime(Date.now() + 1000 * 60 * 16);
        act(() => {
            focusManager.setFocused(false);
            focusManager.setFocused(true);
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
        expect(decodePost).toHaveBeenCalledTimes(1);
    });
});
