import { ApiAppType } from '@repo/api-handlers/client';
import { QueryClient } from '@tanstack/react-query';
import { hc } from 'hono/client';

/**
 * Determines the base URL for API calls based on environment
 * @returns {string} The appropriate base URL for the current environment
 */
const getBaseUrl = (): string => {
    if (import.meta.env.VITE_APP_ENV === 'local') {
        // Get current origin and replace port with 8787
        const url = new URL(window.location.origin);
        url.port = '8787';
        return url.toString();
    }
    return '/';
};

/**
 * API client instance configured with the appropriate base URL
 */
export const { api } = hc<ApiAppType>(getBaseUrl());

/**
 * React Query client for managing server state
 */
export const queryClient = new QueryClient();
