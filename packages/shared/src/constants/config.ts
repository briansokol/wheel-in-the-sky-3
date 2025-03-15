import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { SelectOptionConfig } from '@/types/forms.js';

export const wheelColorSelectOptions: SelectOptionConfig<WheelColorType>[] = [
    {
        id: WheelColorType.Random,
        label: 'Random',
        description: 'Colors on the wheel will be chosen completely at random',
    },
    {
        id: WheelColorType.Monochromatic,
        label: 'Monochromatic',
        description: 'All colors on the wheel will be different shades of the base color',
    },
    {
        id: WheelColorType.Analogous,
        label: 'Analogous',
        description: 'Colors on the wheel will be complimentary colors that are near each other on the color wheel',
    },
    {
        id: WheelColorType.Triad,
        label: 'Triad',
        description:
            'The wheel will use three colors that are of equal distance on the color wheel from the base color',
    },
    {
        id: WheelColorType.Tetrad,
        label: 'Tetrad',
        description: 'The wheel will use four colors that are of equal distance on the color wheel from the base color',
    },
    {
        id: WheelColorType.Custom,
        label: 'Custom',
        description: 'Custom colors will be repeated around the wheel',
    },
];

export const pageColorSelectOptions: SelectOptionConfig<PageColorType>[] = [
    {
        id: PageColorType.GradientNight,
        label: 'Night (Default)',
        description: 'Gradient theme that resembles night',
    },
    {
        id: PageColorType.GradientDay,
        label: 'Day',
        description: 'Gradient theme that resembles day',
    },
    {
        id: PageColorType.GradientDawn,
        label: 'Dawn',
        description: 'Gradient theme that resembles dawn',
    },
    {
        id: PageColorType.GradientTwilight,
        label: 'Twilight',
        description: 'Gradient theme that resembles twilight',
    },
    {
        id: PageColorType.Single,
        label: 'Single Color',
        description: 'Use a single color as the background',
    },
];
