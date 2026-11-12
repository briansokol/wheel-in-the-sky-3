import { Outlet } from 'react-router';
import { RotationProvider } from '@/contexts/rotation-provider';
import { SegmentProvider } from '@/contexts/segment-provider';

export default function WheelPageLayout() {
    return (
        <RotationProvider>
            <SegmentProvider>
                <Outlet />
            </SegmentProvider>
        </RotationProvider>
    );
}
