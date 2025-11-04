import { Breakpoint, Viewport } from '@repo/shared/types/viewport';
import { useEffect, useState } from 'react';

/**
 * Hook that returns the current viewport breakpoint based on window width.
 * Listens to window resize events and updates accordingly.
 * @returns Current viewport breakpoint (S, M, L, XL, or XXL)
 */
export function useCurrentViewport() {
    const [viewport, setViewport] = useState<Viewport>(Viewport.XXL);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < Breakpoint.S) {
                setViewport(Viewport.S);
            } else if (window.innerWidth < Breakpoint.M) {
                setViewport(Viewport.M);
            } else if (window.innerWidth < Breakpoint.L) {
                setViewport(Viewport.L);
            } else if (window.innerWidth < Breakpoint.XL) {
                setViewport(Viewport.XL);
            } else {
                setViewport(Viewport.XXL);
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return viewport;
}

/**
 * Hook that returns the current viewport width.
 * SSR-safe: Uses lazy initializer to avoid accessing window during server-side rendering.
 * Defaults to 1920px if window is not available.
 */
export function useViewportWidth() {
    const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1920));

    useEffect(() => {
        const handleResize = () => {
            setWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return width;
}

/**
 * Hook that returns the current viewport height.
 * SSR-safe: Uses lazy initializer to avoid accessing window during server-side rendering.
 * Defaults to 1080px if window is not available.
 */
export function useViewportHeight() {
    const [height, setHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 1080));

    useEffect(() => {
        const handleResize = () => {
            setHeight(window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return height;
}

/**
 * Hook that returns the larger of viewport width or height.
 * Useful for sizing elements that should fit within the viewport.
 * @returns The larger dimension in pixels
 */
export function useLargestViewportDimension() {
    const width = useViewportWidth();
    const height = useViewportHeight();

    return Math.max(width, height);
}

/**
 * Hook that returns the smaller of viewport width or height.
 * Useful for sizing square elements that should fit within the viewport.
 * @returns The smaller dimension in pixels
 */
export function useSmallestViewportDimension() {
    const width = useViewportWidth();
    const height = useViewportHeight();

    return Math.min(width, height);
}
