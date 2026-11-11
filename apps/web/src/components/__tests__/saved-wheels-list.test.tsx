import { Config } from '@repo/shared/classes/config';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
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

function LocationDisplay() {
    const location = useLocation();
    return <p data-testid="location">{`${location.pathname}${location.hash}`}</p>;
}

function renderSavedWheelsList() {
    return render(
        <MemoryRouter initialEntries={['/wheel#c=encoded']}>
            <ConfigProvider>
                <SegmentProvider>
                    <SavedWheelsList />
                    <LocationDisplay />
                </SegmentProvider>
            </ConfigProvider>
        </MemoryRouter>
    );
}

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
        renderSavedWheelsList();

        expect(screen.getByRole('button', { name: 'Delete Saved Wheel' })).toBeInTheDocument();
        const load = screen.getByRole('button', { name: 'Load this Wheel' });

        fireEvent.keyDown(document.body, { key: 'Tab' });
        fireEvent.keyUp(document.body, { key: 'Tab' });
        load.focus();

        expect(await screen.findByRole('tooltip')).toHaveTextContent('Load this Wheel');
    });

    it('loads a saved wheel through the fragment', () => {
        renderSavedWheelsList();

        fireEvent.click(screen.getByRole('button', { name: 'Load this Wheel' }));

        expect(screen.getByTestId('location')).toHaveTextContent(/^\/wheel#c=abc$/);
    });
});
