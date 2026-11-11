import { Config } from '@repo/shared/classes/config';
import { DEFAULT_BASE_COLOR } from '@repo/shared/constants/colors';
import { WheelColorType } from '@repo/shared/enums/wheel-colors';
import { buildWheelColorConfig } from '@repo/shared/utils/configs';
import { encodeConfig } from '@repo/shared/utils/encoding';
import { getGlowColors } from '@repo/shared/utils/glow-colors';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@/contexts/config-provider';
import { RemovedWinnersProvider } from '@/contexts/removed-winners-provider';
import { RotationProvider } from '@/contexts/rotation-provider';
import { SegmentProvider } from '@/contexts/segment-provider';
import ConfigPage from '../config-page';

const { decodeState } = vi.hoisted(() => ({ decodeState: { isPending: false, monochromatic: false } }));

vi.mock('@repo/shared/utils/encoding', () => ({ encodeConfig: vi.fn() }));

vi.mock('@/hooks/config', () => {
    function makeConfig(wheelColorType: WheelColorType): Config {
        const config = new Config();
        config.setTitle('Team Lunch');
        config.setDescription('Fridays');
        config.setNamesArray(['Alice', 'Bob']);
        config.setRandomizeOrder(true);
        config.setShowNames(false);
        config.setWheelColorType(wheelColorType);
        return config;
    }
    const result = { data: makeConfig(WheelColorType.Triad), isError: false, isPending: false };
    const monochromaticResult = { data: makeConfig(WheelColorType.Monochromatic), isError: false, isPending: false };
    const pendingResult = { data: undefined, isError: false, isPending: true };
    return {
        useDecodedConfig: () =>
            decodeState.isPending ? pendingResult : decodeState.monochromatic ? monochromaticResult : result,
    };
});

function LocationDisplay() {
    const location = useLocation();
    return <p data-testid="location">{`${location.pathname}${location.search}${location.hash}`}</p>;
}

function configPageTree() {
    return (
        <MemoryRouter initialEntries={['/config#c=abc']}>
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

function renderConfigPage() {
    return render(configPageTree());
}

function glowColors(): (string | null)[] {
    return screen.getAllByTestId('wheel-glow').map((glow) => glow.getAttribute('data-color'));
}

// The mocked config sets Triad without a base color, so the form falls back to DEFAULT_BASE_COLOR.
function expectedGlowColors(wheelColorType: WheelColorType): string[] {
    return getGlowColors(buildWheelColorConfig(wheelColorType, DEFAULT_BASE_COLOR, [], false));
}

describe('ConfigPage', () => {
    beforeEach(() => {
        vi.mocked(encodeConfig).mockReset();
        vi.mocked(encodeConfig).mockResolvedValue('v5.encoded');
        decodeState.isPending = false;
        decodeState.monochromatic = false;
    });

    it('populates every field from the loaded config', () => {
        renderConfigPage();

        expect(screen.getByRole('textbox', { name: 'Wheel Title' })).toHaveValue('Team Lunch');
        expect(screen.getByRole('textbox', { name: /Wheel Segments/ })).toHaveValue('Alice\nBob');
        expect(screen.getByRole('switch', { name: 'Randomize Order Every So Often' })).toBeChecked();
        expect(screen.getByRole('switch', { name: 'Show Labels on Wheel' })).not.toBeChecked();
        expect(within(screen.getByTestId('wheel-color-select')).getByRole('button')).toHaveTextContent('Triad');
    });

    it('populates every field once the config finishes loading', () => {
        decodeState.isPending = true;
        const { rerender } = renderConfigPage();
        expect(screen.getByText('Loading configuration...')).toBeInTheDocument();

        decodeState.isPending = false;
        rerender(configPageTree());

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
            expect(encodeConfig).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'Dinner', showNames: true, names: ['Alice', 'Bob'] })
            );
        });
    });

    it('navigates to the wheel fragment on submit', async () => {
        renderConfigPage();

        fireEvent.click(screen.getByRole('button', { name: /Update Existing Wheel/ }));

        await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/wheel#c=v5\.encoded$/));
    });

    it('blocks submit and explains an invalid color', async () => {
        decodeState.monochromatic = true;
        renderConfigPage();

        fireEvent.change(screen.getByRole('textbox', { name: 'Chosen Color' }), { target: { value: 'nope' } });
        fireEvent.click(screen.getByRole('button', { name: /Update Existing Wheel/ }));

        expect(await screen.findByText('Enter a hex color like #4062bf')).toBeInTheDocument();
        expect(encodeConfig).not.toHaveBeenCalled();
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
        expect(encodeConfig).not.toHaveBeenCalled();
    });

    it('focuses the segments field when submitting without segments', async () => {
        renderConfigPage();

        const segments = screen.getByRole('textbox', { name: /Wheel Segments/ });
        fireEvent.change(segments, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /Update Existing Wheel/ }));

        await waitFor(() => expect(document.activeElement).toBe(segments));
    });

    it('requires at least one segment when creating a new wheel', async () => {
        renderConfigPage();

        const segments = screen.getByRole('textbox', { name: /Wheel Segments/ });
        fireEvent.change(segments, { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /Create New Wheel/ }));

        expect(await screen.findByText('You must have at least 1 segment to make a wheel!')).toBeInTheDocument();
        await waitFor(() => expect(document.activeElement).toBe(segments));
        expect(encodeConfig).not.toHaveBeenCalled();
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

    it("shows glows from the wheel's color settings", () => {
        renderConfigPage();

        expect(glowColors()).toEqual(expectedGlowColors(WheelColorType.Triad));
    });

    it('changing the color scheme updates the glows', async () => {
        renderConfigPage();
        const before = glowColors();

        const trigger = within(screen.getByTestId('wheel-color-select')).getByRole('button');
        act(() => trigger.focus());
        fireEvent.keyDown(trigger, { key: 'ArrowDown' });
        fireEvent.keyUp(trigger, { key: 'ArrowDown' });
        fireEvent.click(await screen.findByRole('option', { name: /Tetrad/ }));

        await waitFor(() => expect(glowColors()).toEqual(expectedGlowColors(WheelColorType.Tetrad)));
        expect(glowColors()).not.toEqual(before);
    });

    it('typing names does not change the glows', () => {
        renderConfigPage();
        const before = glowColors();

        const segments = screen.getByRole('textbox', { name: /Wheel Segments/ });
        fireEvent.change(segments, { target: { value: 'Carol\nDave\nEve' } });

        expect(segments).toHaveValue('Carol\nDave\nEve');
        expect(glowColors()).toEqual(before);
    });
});
