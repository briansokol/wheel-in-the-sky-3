import { Outlet } from 'react-router';
import { RotationProvider } from '@/contexts/rotation-provider';

export default function ConfigPageLayout() {
    return (
        <RotationProvider>
            <Outlet />
        </RotationProvider>
    );
}
