import { Breakpoint, Viewport } from '@repo/shared/types/viewport';
import { useEffect, useState } from 'react';

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

export function useViewportWidth() {
    const [width, setWidth] = useState(window.innerWidth);

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

export function useViewportHeight() {
    const [height, setHeight] = useState(window.innerHeight);

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

export function useLargestViewportDimenstion() {
    const width = useViewportWidth();
    const height = useViewportHeight();

    return Math.max(width, height);
}

export function useSmallestViewportDimenstion() {
    const width = useViewportWidth();
    const height = useViewportHeight();

    return Math.min(width, height);
}
