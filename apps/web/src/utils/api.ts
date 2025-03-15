import { ApiAppType } from '@repo/api-handlers/client';
import { QueryClient } from '@tanstack/react-query';
import { hc } from 'hono/client';

export const api = hc<ApiAppType>('http://localhost:8787/');
export const queryClient = new QueryClient();
