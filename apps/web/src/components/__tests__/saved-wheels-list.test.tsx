import { Config } from '@repo/shared/classes/config';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@/contexts/config-provider';
import { SegmentProvider } from '@/contexts/segment-provider';
import { SavedWheelsList } from '../saved-wheels-list';

vi.mock('@/hooks/config', () => {
    const config = new Config();
    config.setNamesArray(['Alice', 'Bob']);
    return {
        useDecodedConfig: () => ({ data: config, isError: false, isPending: false }),
    };
});

describe('SavedWheelsList', () => {
    beforeEach(() => {
        localStorage.setItem(
            'savedWheels',
            JSON.stringify({
                w1: {
                    id: 'w1',
                    title: 'My Wheel',
                    encodedConfig: 'abc',
                    createdAt: '2020-01-01T00:00:00.000Z',
                    updatedAt: '2020-01-01T00:00:00.000Z',
                },
            })
        );
    });

    it('exposes the icon buttons by accessible name and shows a tooltip on focus', async () => {
        render(
            <MemoryRouter initialEntries={['/wheel?c=encoded']}>
                <ConfigProvider>
                    <SegmentProvider>
                        <SavedWheelsList />
                    </SegmentProvider>
                </ConfigProvider>
            </MemoryRouter>
        );

        expect(screen.getByRole('button', { name: 'Delete Saved Wheel' })).toBeInTheDocument();
        const load = screen.getByRole('button', { name: 'Load this Wheel' });

        fireEvent.keyDown(document.body, { key: 'Tab' });
        fireEvent.keyUp(document.body, { key: 'Tab' });
        load.focus();

        expect(await screen.findByRole('tooltip')).toHaveTextContent('Load this Wheel');
    });
});
