import { Outlet } from 'react-router';
import { AppNavBar } from '@/components/navbar';

export function RootLayout() {
    return (
        <>
            <AppNavBar />
            <Outlet />
        </>
    );
}
