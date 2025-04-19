import { HeroUIProvider } from '@heroui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { queryClient } from '@/utils/api';
import { RotationProvider } from './contexts/rotation-provider';
import { SegmentProvider } from './contexts/segment-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    return (
        <QueryClientProvider client={queryClient}>
            <RotationProvider>
                <SegmentProvider>
                    <RemovedWinnersProvider>
                        <HeroUIProvider navigate={navigate}>{children}</HeroUIProvider>
                    </RemovedWinnersProvider>
                </SegmentProvider>
            </RotationProvider>
        </QueryClientProvider>
    );
}
