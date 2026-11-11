import { RouterProvider } from '@heroui/react';
import { useHref, useNavigate } from 'react-router';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { ConfigProvider } from './contexts/config-provider';
import { RotationProvider } from './contexts/rotation-provider';
import { SegmentProvider } from './contexts/segment-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate();

    return (
        <ConfigProvider>
            <RotationProvider>
                <SegmentProvider>
                    <RemovedWinnersProvider>
                        <RouterProvider navigate={navigate} useHref={useHref}>
                            {children}
                        </RouterProvider>
                    </RemovedWinnersProvider>
                </SegmentProvider>
            </RotationProvider>
        </ConfigProvider>
    );
}
