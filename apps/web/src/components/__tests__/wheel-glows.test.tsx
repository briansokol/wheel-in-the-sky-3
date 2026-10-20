import { render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WheelGlows } from '../wheel-glows';

const motionMock = vi.hoisted(() => ({
    reduceMotion: false,
    transitions: [] as unknown[],
}));

// Only useReducedMotion and the transition passed to motion.div are intercepted; rendering stays real.
vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal<typeof import('framer-motion')>();
    function MotionDiv(props: ComponentProps<typeof actual.motion.div>) {
        motionMock.transitions.push(props.transition);
        return <actual.motion.div {...props} />;
    }
    return {
        ...actual,
        useReducedMotion: () => motionMock.reduceMotion,
        motion: { ...actual.motion, div: MotionDiv },
    };
});

function glowColors(): (string | null)[] {
    return screen.getAllByTestId('wheel-glow').map((glow) => glow.getAttribute('data-color'));
}

describe('WheelGlows', () => {
    afterEach(() => {
        motionMock.reduceMotion = false;
        motionMock.transitions = [];
    });

    it('renders one glow per color', () => {
        const colors = ['#c031e2', '#14b8a6', '#f59e0b'];
        render(<WheelGlows colors={colors} />);

        expect(screen.getAllByTestId('wheel-glow')).toHaveLength(3);
        expect(glowColors()).toEqual(colors);
    });

    it('is hidden from assistive tech', () => {
        render(<WheelGlows colors={['#c031e2']} />);

        expect(screen.getByTestId('wheel-glows')).toHaveAttribute('aria-hidden', 'true');
    });

    it('applies new colors when props change', async () => {
        const { rerender } = render(<WheelGlows colors={['#c031e2', '#14b8a6', '#f59e0b']} />);

        rerender(<WheelGlows colors={['#ff0000']} />);

        // Removed glows fade out before they leave the DOM.
        await waitFor(() => expect(screen.getAllByTestId('wheel-glow')).toHaveLength(1));
        expect(screen.getByTestId('wheel-glow')).toHaveAttribute('data-color', '#ff0000');
    });

    it('tweens over 0.6s by default', () => {
        render(<WheelGlows colors={['#c031e2']} />);

        expect(motionMock.transitions).toContainEqual({ duration: 0.6, ease: 'easeInOut' });
    });

    it('uses a zero-duration transition when reduced motion is preferred', () => {
        motionMock.reduceMotion = true;
        render(<WheelGlows colors={['#c031e2', '#14b8a6']} />);

        expect(motionMock.transitions.length).toBeGreaterThan(0);
        expect(motionMock.transitions.every((t) => (t as { duration: number }).duration === 0)).toBe(true);
    });
});
