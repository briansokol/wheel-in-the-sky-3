import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WheelGlows } from '../wheel-glows';

function glowColors(): (string | null)[] {
    return screen.getAllByTestId('wheel-glow').map((glow) => glow.getAttribute('data-color'));
}

describe('WheelGlows', () => {
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

    it('applies new colors when props change', () => {
        const { rerender } = render(<WheelGlows colors={['#c031e2', '#14b8a6', '#f59e0b']} />);

        rerender(<WheelGlows colors={['#ff0000']} />);

        expect(screen.getAllByTestId('wheel-glow')).toHaveLength(1);
        expect(screen.getByTestId('wheel-glow')).toHaveAttribute('data-color', '#ff0000');
    });
});
