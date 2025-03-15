import { Button, Input } from '@heroui/react';
import type { FormColorNameValue } from '@repo/shared/types/config';
import { debounce } from 'es-toolkit';
import { type FC, useCallback, useMemo } from 'react';
import { HexColorPicker } from 'react-colorful';
import { useFormContext } from 'react-hook-form';

interface ColorPickerProps {
    singleColorName: FormColorNameValue;
    multiColorName?: FormColorNameValue;
    allowMultiColor: boolean;
}

export const ColorPicker: FC<ColorPickerProps> = ({ singleColorName, multiColorName = '', allowMultiColor }) => {
    const { setValue, watch } = useFormContext();

    const debouncedSetColor = useMemo(() => {
        return debounce((value: string) => setValue(singleColorName, value), 100);
    }, [singleColorName, setValue]);

    const color: string = watch(singleColorName);
    const watchColors = watch(multiColorName);
    const colors: string[] = useMemo(
        () => (multiColorName !== undefined && watchColors !== undefined ? JSON.parse(watchColors) : []),
        [multiColorName, watchColors]
    );

    const addColor = useCallback(() => {
        if (multiColorName !== undefined && !colors.includes(color)) {
            const newColors = [...colors, color];
            setValue(multiColorName, JSON.stringify(newColors));
        }
    }, [color, colors, multiColorName, setValue]);

    const removeColor = useCallback(
        (index: number) => () => {
            if (multiColorName !== undefined) {
                const newColors = [...colors];
                newColors.splice(index, 1);
                setValue(multiColorName, JSON.stringify(newColors));
            }
        },
        [colors, multiColorName, setValue]
    );

    return (
        <>
            <HexColorPicker color={color} onChange={debouncedSetColor} style={{ width: '100%' }} />
            <div className="my-3">
                <Input
                    className="mr-3 inline-block w-[120px]"
                    type="text"
                    value={color}
                    onChange={(e) => setValue(singleColorName, e.target.value)}
                    aria-label="Chosen Color"
                />
                {allowMultiColor && multiColorName && (
                    <Button className="mr-3" onPress={addColor} color="default">
                        Add Color
                    </Button>
                )}
                {colors && colors.length > 0 && 'Click a color to remove it'}
            </div>
            {allowMultiColor && multiColorName && (
                <div data-testid="picker-color-list" className="flex flex-wrap">
                    {colors.map((color, i) => (
                        <Button
                            key={color}
                            className="relative mb-3 mr-3"
                            style={{ background: color }}
                            onPress={removeColor(i)}
                        ></Button>
                    ))}
                </div>
            )}
        </>
    );
};
