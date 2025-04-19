import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { RootLayout } from '@/layout';

const HomePage = lazy(() => import('@/pages/home-page'));
const WheelPage = lazy(() => import('@/pages/wheel-page'));
const ConfigPage = lazy(() => import('@/pages/config-page'));
const AboutPage = lazy(() => import('@/pages/about-page'));

export function Router() {
    return (
        <Routes>
            <Route path="/" element={<RootLayout />}>
                <Route index element={<HomePage />} />
                <Route path="wheel/v3/:id?" element={<WheelPage />} />
                <Route path="config/v3/:id?" element={<ConfigPage />} />
                <Route path="about" element={<AboutPage />} />
            </Route>
        </Routes>
    );
}
