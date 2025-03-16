import { ApiAppType } from '@repo/api-handlers/client';
import { QueryClient } from '@tanstack/react-query';
import { hc } from 'hono/client';

export const { api } = hc<ApiAppType>(import.meta.env.VITE_APP_ENV === 'local' ? 'http://localhost:8787/' : '/');
export const queryClient = new QueryClient();
