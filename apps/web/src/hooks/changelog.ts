import { UseQueryResult, useQuery } from '@tanstack/react-query';

export function useChangeLog(): UseQueryResult<string> {
    return useQuery({
        queryKey: ['changelog'],
        queryFn: async (): Promise<string> => {
            const response = await fetch('/CHANGELOG.md');
            if (response && response.ok) {
                return await response.text();
            } else {
                throw new Error('Failed to get changelog');
            }
        },
        retry: 1,
        staleTime: 1000 * 60 * 15,
    });
}
