import { lazy } from 'react';
import { Route, Routes } from 'react-router';
import { RootLayout } from '@/layout';

const HomePage = lazy(() => import('@/pages/home-page'));
const WheelPageLayout = lazy(() => import('@/pages/wheel-page-layout'));
const WheelPage = lazy(() => import('@/pages/wheel-page'));
const ConfigPageLayout = lazy(() => import('@/pages/config-page-layout'));
const ConfigPage = lazy(() => import('@/pages/config-page'));
const AboutPage = lazy(() => import('@/pages/about-page'));

export function Router() {
    return (
        <Routes>
            <Route path="/" element={<RootLayout />}>
                <Route index element={<HomePage />} />
                <Route path="wheel" element={<WheelPageLayout />}>
                    <Route path="v3/:id?" element={<WheelPage />} />
                </Route>
                <Route path="config" element={<ConfigPageLayout />}>
                    <Route path="v3/:id?" element={<ConfigPage />} />
                </Route>
                <Route path="about" element={<AboutPage />} />
            </Route>
        </Routes>
    );
}
