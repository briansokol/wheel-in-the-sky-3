import { fireEvent, render, screen, within } from '@testing-library/react';
import { type FC, type ReactNode } from 'react';
import { FormProvider, UseFormSetValue, useForm } from 'react-hook-form';
import { MockInstance } from 'vitest';
import { ColorPicker } from '@/components/color-picker';

const initialColor = {
    baseColor: '#ff0000',
    saturation: 'Saturation 100%, Brightness 100%',
    hue: '0',
};

const changedColor = {
    baseColor: '#4062bf',
    saturation: 'Saturation 66%, Brightness 75%',
    hue: '224',
};

describe('ColorPicker', () => {
    let setValueSpy: MockInstance<UseFormSetValue<{ baseColor: string; customColors: string }>>;

    const TestForm: FC<{ children: ReactNode; singleColor: string; multiColor?: string[] }> = ({
        singleColor,
        multiColor,
        children,
    }) => {
        const methods = useForm({
            defaultValues: {
                baseColor: singleColor,
                customColors: JSON.stringify(multiColor ?? []),
            },
        });

        // eslint-disable-next-line react-compiler/react-compiler
        setValueSpy = vi.spyOn(methods, 'setValue');

        return <FormProvider {...methods}>{children}</FormProvider>;
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('renders color picker and input field with minimum required props', () => {
        render(
            <TestForm singleColor={initialColor.baseColor}>
                <ColorPicker singleColorName="baseColor" allowMultiColor={false} />
            </TestForm>
        );

        const textInput = screen.getByLabelText('Chosen Color');
        const saturation = screen.getByLabelText('Color');
        const hue = screen.getByLabelText('Hue');

        expect(screen.getByLabelText('Color')).toBeInTheDocument();
        expect(textInput).toHaveValue(initialColor.baseColor);
        expect(saturation.ariaValueText).toBe(initialColor.saturation);
        expect(hue.ariaValueNow).toBe(initialColor.hue);
    });

    it('handles color input changes', () => {
        render(
            <TestForm singleColor={initialColor.baseColor}>
                <ColorPicker singleColorName="baseColor" allowMultiColor={false} />
            </TestForm>
        );

        const textInput = screen.getByLabelText('Chosen Color');
        const saturation = screen.getByLabelText('Color');
        const hue = screen.getByLabelText('Hue');

        fireEvent.change(screen.getByLabelText('Chosen Color'), {
            target: { value: changedColor.baseColor },
        });

        expect(textInput).toHaveValue(changedColor.baseColor);
        expect(saturation.ariaValueText).toBe(changedColor.saturation);
        expect(hue.ariaValueNow).toBe(changedColor.hue);
    });

    it.skip('debounces color picker changes', async () => {
        render(
            <TestForm singleColor={initialColor.baseColor}>
                <ColorPicker singleColorName="baseColor" allowMultiColor={false} />
            </TestForm>
        );

        expect(setValueSpy).not.toHaveBeenCalled();

        // eslint-disable-next-line testing-library/no-node-access
        const colorPicker = document.querySelector('.react-colorful__interactive');
        fireEvent.click(colorPicker as Element);

        expect(setValueSpy).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(setValueSpy).not.toHaveBeenCalled();

        vi.advanceTimersByTime(50);
        expect(setValueSpy).toHaveBeenCalled();
    });

    it('matches single color snapshot', () => {
        const { container } = render(
            <TestForm singleColor={initialColor.baseColor}>
                <ColorPicker singleColorName="baseColor" allowMultiColor={false} />
            </TestForm>
        );
        expect(container.firstChild).toMatchSnapshot();
    });

    describe('multi-color mode', () => {
        it('renders add color button when allowMultiColor is true', () => {
            render(
                <TestForm singleColor={initialColor.baseColor}>
                    <ColorPicker singleColorName="baseColor" multiColorName="customColors" allowMultiColor={true} />
                </TestForm>
            );

            expect(screen.getByText('Add Color')).toBeInTheDocument();
        });

        it('adds new color to list when add color button is clicked', () => {
            render(
                <TestForm singleColor={initialColor.baseColor}>
                    <ColorPicker singleColorName="baseColor" multiColorName="customColors" allowMultiColor={true} />
                </TestForm>
            );

            const textInput = screen.getByLabelText('Chosen Color');
            const colorList = screen.getByTestId('picker-color-list');
            expect(within(colorList).queryAllByRole('button')).toHaveLength(0);

            fireEvent.click(screen.getByText('Add Color'));
            expect(within(colorList).queryAllByRole('button')).toHaveLength(1);

            fireEvent.change(textInput, {
                target: { value: changedColor.baseColor },
            });
            fireEvent.click(screen.getByText('Add Color'));
            expect(within(colorList).queryAllByRole('button')).toHaveLength(2);
        });

        it('prevents adding duplicate colors', () => {
            render(
                <TestForm singleColor={initialColor.baseColor}>
                    <ColorPicker singleColorName="baseColor" multiColorName="customColors" allowMultiColor={true} />
                </TestForm>
            );

            const colorList = screen.getByTestId('picker-color-list');
            expect(within(colorList).queryAllByRole('button')).toHaveLength(0);

            fireEvent.click(screen.getByText('Add Color'));
            expect(within(colorList).queryAllByRole('button')).toHaveLength(1);

            fireEvent.click(screen.getByText('Add Color'));
            expect(within(colorList).queryAllByRole('button')).toHaveLength(1);
        });

        it('removes color when color button is clicked', () => {
            render(
                <TestForm singleColor={initialColor.baseColor}>
                    <ColorPicker singleColorName="baseColor" multiColorName="customColors" allowMultiColor={true} />
                </TestForm>
            );

            const colorList = screen.getByTestId('picker-color-list');
            expect(within(colorList).queryAllByRole('button')).toHaveLength(0);

            fireEvent.click(screen.getByText('Add Color'));
            expect(within(colorList).queryAllByRole('button')).toHaveLength(1);

            fireEvent.click(within(colorList).queryAllByRole('button')[0]);
            expect(within(colorList).queryAllByRole('button')).toHaveLength(0);
        });

        it('displays instruction text when colors exist', () => {
            render(
                <TestForm singleColor={initialColor.baseColor}>
                    <ColorPicker singleColorName="baseColor" multiColorName="customColors" allowMultiColor={true} />
                </TestForm>
            );

            expect(screen.queryByText('Click a color to remove it')).not.toBeInTheDocument();

            const addColorButton = screen.getByText('Add Color');
            expect(addColorButton).toBeInTheDocument();

            fireEvent.click(addColorButton);

            expect(screen.getByText('Click a color to remove it')).toBeInTheDocument();
        });

        it('matches multi-color snapshot', () => {
            const { container } = render(
                <TestForm singleColor={initialColor.baseColor}>
                    <ColorPicker singleColorName="baseColor" multiColorName="customColors" allowMultiColor={true} />
                </TestForm>
            );
            expect(container.firstChild).toMatchSnapshot();
        });
    });
});
