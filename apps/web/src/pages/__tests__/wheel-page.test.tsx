import { Config } from '@repo/shared/classes/config';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@/contexts/config-provider';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { RotationProvider } from '@/contexts/rotation-provider';
import { SegmentProvider } from '@/contexts/segment-provider';
import WheelPage from '../wheel-page';

vi.mock('@/hooks/config', () => {
    const config = new Config();
    config.setNamesArray(['Alice', 'Bob', 'Carol']);
    return {
        useDecodedConfig: () => ({ data: config, isError: false, isPending: false }),
    };
});

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
});
