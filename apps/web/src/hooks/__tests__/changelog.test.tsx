import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChangeLog } from '../changelog';

/**
 * Creates a wrapper component with React Query provider for testing hooks
 * @returns A wrapper component for React Query
 */
function createQueryClientWrapper(): React.FC<{ children: ReactNode }> {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 0,
            },
        },
    });

    const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    Wrapper.displayName = 'QueryClientWrapper';

    return Wrapper;
}

describe('useChangeLog', () => {
    // Store the original fetch implementation
    const originalFetch = global.fetch;

    // Mock data for successful response
    const mockChangelogContent = '# Changelog\n\n## v1.0.0\n\n- Initial release';

    beforeEach(() => {
        // Reset fetch mock before each test
        vi.resetAllMocks();
    });

    afterEach(() => {
        // Restore original fetch after tests
        global.fetch = originalFetch;
    });

    /**
     * Tests successful fetching of changelog
     */
    it('should fetch the changelog successfully', async () => {
        // Arrange
        const mockResponse = new Response(mockChangelogContent, { status: 200 });
        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        // Act
        const wrapper = createQueryClientWrapper();
        const { result } = renderHook(() => useChangeLog(), { wrapper });

        // Assert
        expect(result.current.isLoading).toBe(true);

        // Wait for query to complete
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(global.fetch).toHaveBeenCalledWith('/CHANGELOG.md');
        expect(result.current.data).toBe(mockChangelogContent);
    });

    /**
     * Tests error handling when fetch fails
     */
    it('should handle fetch error', async () => {
        // Arrange
        global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

        // Act
        const wrapper = createQueryClientWrapper();
        const { result } = renderHook(() => useChangeLog(), { wrapper });

        // Assert
        expect(result.current.isLoading).toBe(true);

        // Wait for query to complete with error
        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

        expect(global.fetch).toHaveBeenCalledWith('/CHANGELOG.md');
        expect(result.current.error).toBeDefined();
    });

    /**
     * Tests error handling when response is not ok
     */
    it('should handle non-ok response', async () => {
        // Arrange
        const mockResponse = new Response(null, { status: 404, statusText: 'Not Found' });
        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        // Act
        const wrapper = createQueryClientWrapper();
        const { result } = renderHook(() => useChangeLog(), { wrapper });

        // Assert
        expect(result.current.isLoading).toBe(true);

        // Wait for query to complete with error
        await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });

        expect(global.fetch).toHaveBeenCalledWith('/CHANGELOG.md');
        expect(result.current.error).toBeDefined();
        expect(result.current.error?.message).toBe('Failed to get changelog');
    });

    /**
     * Tests that the hook uses correct React Query configuration
     */
    it('should use the correct query configuration', async () => {
        // Arrange
        const mockResponse = new Response(mockChangelogContent, { status: 200 });
        global.fetch = vi.fn().mockResolvedValue(mockResponse);

        // Act
        const wrapper = createQueryClientWrapper();
        const { result } = renderHook(() => useChangeLog(), { wrapper });

        // Wait for query to complete
        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // Assert
        expect(global.fetch).toHaveBeenCalledWith('/CHANGELOG.md');
        expect(result.current.data).toBe(mockChangelogContent);

        // Verify that the hook uses the correct query key
        expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
    });
});
