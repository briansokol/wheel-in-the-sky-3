import { Config } from '@repo/shared/classes/config';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@/contexts/config-provider';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { RotationProvider } from '@/contexts/rotation-provider';
import { SegmentProvider } from '@/contexts/segment-provider';
import ConfigPage from '../config-page';

const { mutateAsync } = vi.hoisted(() => ({ mutateAsync: vi.fn() }));

vi.mock('@/hooks/config', () => {
    const config = new Config();
    config.setTitle('Team Lunch');
    config.setDescription('Fridays');
    config.setNamesArray(['Alice', 'Bob']);
    config.setRandomizeOrder(true);
    config.setShowNames(false);
    config.setWheelColorType(WheelColorType.Triad);
    const result = { data: config, isError: false, isPending: false };
    return {
        useDecodedConfig: () => result,
        useEncodeConfigMutation: () => ({ mutateAsync }),
    };
});

function LocationDisplay() {
    const location = useLocation();
    return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderConfigPage() {
    return render(
        <MemoryRouter initialEntries={['/config?c=abc']}>
            <ConfigProvider>
                <RotationProvider>
                    <SegmentProvider>
                        <RemovedWinnersProvider>
                            <ConfigPage />
                            <LocationDisplay />
                        </RemovedWinnersProvider>
                    </SegmentProvider>
                </RotationProvider>
            </ConfigProvider>
        </MemoryRouter>
    );
}

describe('ConfigPage', () => {
    beforeEach(() => {
        mutateAsync.mockReset();
        mutateAsync.mockResolvedValue({ encodedConfig: 'enc' });
    });

    it('populates every field from the loaded config', () => {
        renderConfigPage();

        expect(screen.getByRole('textbox', { name: 'Wheel Title' })).toHaveValue('Team Lunch');
        expect(screen.getByRole('textbox', { name: /Wheel Segments/ })).toHaveValue('Alice\nBob');
        expect(screen.getByRole('switch', { name: 'Randomize Order Every So Often' })).toBeChecked();
        expect(screen.getByRole('switch', { name: 'Show Labels on Wheel' })).not.toBeChecked();
        expect(within(screen.getByTestId('wheel-color-select')).getByRole('button')).toHaveTextContent('Triad');
    });

    it('submits the edited values', async () => {
        renderConfigPage();

        fireEvent.change(screen.getByRole('textbox', { name: 'Wheel Title' }), { target: { value: 'Dinner' } });
        fireEvent.click(screen.getByRole('switch', { name: 'Show Labels on Wheel' }));
        fireEvent.click(screen.getByRole('button', { name: /Update Existing Wheel/ }));

        await waitFor(() => {
            expect(mutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Dinner', showNames: true, names: 'Alice\nBob' })
            );
        });
    });

    it('changing the color scheme updates its description', async () => {
        renderConfigPage();

        const trigger = within(screen.getByTestId('wheel-color-select')).getByRole('button');
        act(() => trigger.focus());
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyUp(trigger, { key: 'ArrowDown' });

        const option = await screen.findByRole('option', { name: /Tetrad/ });
        fireEvent.click(option);

        expect(
            await screen.findByText(
                'The wheel will use four colors that are of equal distance on the color wheel from the base color'
            )
        ).toBeInTheDocument();
        expect(trigger).toHaveTextContent('Tetrad');
    });

    it('requires at least one segment', async () => {
        renderConfigPage();

        fireEvent.change(screen.getByRole('textbox', { name: /Wheel Segments/ }), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /Update Existing Wheel/ }));

        expect(await screen.findByText('You must have at least 1 segment to make a wheel!')).toBeInTheDocument();
        expect(mutateAsync).not.toHaveBeenCalled();
    });

    it('Reset restores the loaded values', async () => {
        renderConfigPage();

        const titleInput = screen.getByRole('textbox', { name: 'Wheel Title' });
        fireEvent.change(titleInput, { target: { value: 'Something Else' } });
        expect(titleInput).toHaveValue('Something Else');

        fireEvent.click(screen.getByRole('button', { name: /Reset Form/ }));

        await waitFor(() => {
            expect(screen.getByRole('textbox', { name: 'Wheel Title' })).toHaveValue('Team Lunch');
        });
        expect(screen.getByTestId('location')).toHaveTextContent(/^\/config$/);
    });
});
