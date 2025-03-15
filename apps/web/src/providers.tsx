import { HeroUIProvider } from '@heroui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { queryClient } from '@/utils/api';

export function Providers({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    return (
        <QueryClientProvider client={queryClient}>
            <HeroUIProvider navigate={navigate}>{children}</HeroUIProvider>
        </QueryClientProvider>
    );
}
