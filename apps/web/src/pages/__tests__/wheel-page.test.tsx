import { Config } from '@repo/shared/classes/config';
import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@/contexts/config-provider';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { RotationProvider } from '@/contexts/rotation-provider';
import { useSegment } from '@/contexts/segment';
import { SegmentProvider } from '@/contexts/segment-provider';
import WheelPage from '../wheel-page';

vi.mock('@/hooks/config', () => {
    const config = new Config();
    config.setNamesArray(['Alice', 'Bob', 'Carol']);
    return {
        useDecodedConfig: () => ({ data: config, isError: false, isPending: false }),
    };
});

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function WinnerSetter() {
    const { setHasWinner } = useSegment();
    useEffect(() => {
        setHasWinner(true);
    }, [setHasWinner]);
    return null;
}

describe('WheelPage', () => {
    it('anchors the wheel to the viewport so page scroll cannot shift it off center', () => {
        render(
            <MemoryRouter initialEntries={['/wheel?c=encoded']}>
                <ConfigProvider>
                    <RotationProvider>
                        <SegmentProvider>
                            <RemovedWinnersProvider>
                                <WheelPage />
                            </RemovedWinnersProvider>
                        </SegmentProvider>
                    </RotationProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        const wheelContainer = screen.getByText('Alice').closest('.top-1\\/2.left-1\\/2');
        expect(wheelContainer).toHaveClass('fixed');
        expect(wheelContainer).not.toHaveClass('absolute');
    });

    it('renders the winner card as a glass surface', () => {
        render(
            <MemoryRouter initialEntries={['/wheel?c=encoded']}>
                <ConfigProvider>
                    <RotationProvider>
                        <SegmentProvider>
                            <RemovedWinnersProvider>
                                <WinnerSetter />
                                <WheelPage />
                            </RemovedWinnersProvider>
                        </SegmentProvider>
                    </RotationProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        const card = screen.getByRole('button', { name: /Copy Banner/ }).closest('.card');
        expect(card).toHaveClass('glass-surface');
        expect(screen.getByRole('button', { name: /Copy Banner/ })).toHaveClass('glass-rim');
    });
});
