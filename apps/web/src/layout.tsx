import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppNavBar } from '@/components/navbar';
import { useSegment } from './contexts/segment';

export function RootLayout() {
    const { setHasWinner } = useSegment();
    const location = useLocation();

    useEffect(() => {
        setHasWinner(false);
    }, [location, setHasWinner]);

    return (
        <>
            <AppNavBar />
            <ErrorBoundary>
                <Outlet />
            </ErrorBoundary>
        </>
    );
}
