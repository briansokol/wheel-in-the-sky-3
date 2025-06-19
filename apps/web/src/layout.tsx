import { useContext, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { AppNavBar } from '@/components/navbar';
import { SegmentContext } from './contexts/segment';

export function RootLayout() {
    const { setHasWinner } = useContext(SegmentContext);
    const location = useLocation();

    useEffect(() => {
        setHasWinner?.(false);
    }, [location, setHasWinner]);

    return (
        <>
            <AppNavBar />
            <Outlet />
        </>
    );
}
