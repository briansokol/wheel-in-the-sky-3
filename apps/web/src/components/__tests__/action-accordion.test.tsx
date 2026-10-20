import { Config } from '@repo/shared/classes/config';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@/contexts/config-provider';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { SegmentProvider } from '@/contexts/segment-provider';
import { ActionAccordion } from '../action-accordion';

vi.mock('@/hooks/config', () => {
    const config = new Config();
    config.setNamesArray(['Alice', 'Bob', 'Carol']);
    return {
        useDecodedConfig: () => ({ data: config, isError: false, isPending: false }),
    };
});

function renderAccordion() {
    return render(
        <MemoryRouter initialEntries={['/wheel?c=encoded']}>
            <ConfigProvider>
                <SegmentProvider>
                    <RemovedWinnersProvider>
                        <ActionAccordion pathname="/wheel" closeDrawer={vi.fn()} />
                    </RemovedWinnersProvider>
                </SegmentProvider>
            </ConfigProvider>
        </MemoryRouter>
    );
}

describe('ActionAccordion', () => {
    it('shows Saved Wheels and Removed Winners expanded by default', () => {
        renderAccordion();

        expect(screen.getByRole('button', { name: /Saved Wheels/ })).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('button', { name: /Removed Winners/ })).toHaveAttribute('aria-expanded', 'true');
    });

    it('collapses a section when its header is clicked', () => {
        renderAccordion();

        const trigger = screen.getByRole('button', { name: /Saved Wheels/ });
        fireEvent.click(trigger);

        expect(trigger).toHaveAttribute('aria-expanded', 'false');
        expect(screen.getByRole('button', { name: /Removed Winners/ })).toHaveAttribute('aria-expanded', 'true');
    });
});
