import { TinyColor, random } from '@ctrl/tinycolor';
// import { type Dispatch, type SetStateAction } from 'react';
import { Config } from '@/classes/config.js';
import { Segment } from '@/classes/segment.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { WheelColorConfig } from '@/types/wheel-colors.js';
import { RotationDirection } from '@/types/wheel.js';

export class WheelManager {
    public static winnerStorageKey = 'winners';
    public segmentArc = 0;
    public segments: Segment[] = [];
    public removedWinners: string[] = [];
    public config: Config = new Config();
    public colors: TinyColor[] = [];
    private _segmentEdges: number[] = [];
    // private _setRotationDispatch: Dispatch<SetStateAction<number>> | undefined;

    get segmentCount(): number {
        return this.segments?.length ?? 0;
    }

    private static _getRandomizedNames(names: string[], randomizeNames: boolean): string[] {
        if (!randomizeNames) {
            return names;
        }

        const randomizedNames = [...names];
        for (let i = randomizedNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [randomizedNames[i], randomizedNames[j]] = [randomizedNames[j], randomizedNames[i]];
        }
        return randomizedNames;
    }

    private static _getRandomizedColors(colors: TinyColor[]): TinyColor[] {
        const randomizedColors = [...colors];
        for (let i = randomizedColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [randomizedColors[i], randomizedColors[j]] = [randomizedColors[j], randomizedColors[i]];
        }
        return randomizedColors;
    }

    public init(config: Config, removedNames: string[]) {
        this.config = config;
        this.removedWinners = removedNames;

        const names: string[] =
            removedNames.length > 0
                ? this.config.names.filter((name) => !removedNames.includes(name))
                : [...this.config.names];

        this.segmentArc = 360 / names.length;
        this._segmentEdges = [...names.map((_, i) => i * this.segmentArc), 360];

        const segmentNames: string[] = WheelManager._getRandomizedNames(names, this.config.randomizeOrder);

        this.colors = this._getColors(segmentNames, this.config.wheelColorConfig);

        let colorIndex = 0;
        this.segments = segmentNames.map((name, i) => {
            if (colorIndex >= this.colors.length) {
                colorIndex = 0;
            }
            return new Segment(
                i,
                name,
                360 / segmentNames.length,
                this._segmentEdges[names.length - 1 - i],
                this._segmentEdges[names.length - i],
                this.colors[colorIndex++]
            );
        });
    }

    // public setRotationDispatch(setRotation: Dispatch<SetStateAction<number>>): void {
    //     this._setRotationDispatch = setRotation;
    // }

    // public setRotation(rotation: SetStateAction<number>): void {
    //     if (this._setRotationDispatch) {
    //         this._setRotationDispatch(rotation);
    //     }
    // }

    public getSegmentByRotation(rotation?: number): Segment | undefined {
        if (rotation === undefined) {
            return undefined;
        }
        return (
            this.segments.find(
                (segment) => segment.rotationStartAngle <= rotation && segment.rotationEndAngle > rotation
            ) ?? undefined
        );
    }

    public getAdjacentSegmentByRotation(rotation: number, direction: RotationDirection): Segment | undefined {
        const segment = this.getSegmentByRotation(rotation);
        if (!segment) {
            return undefined;
        }

        if (direction === RotationDirection.None) {
            return segment;
        }

        const segmentIndex = this.segments.indexOf(segment);
        if (segmentIndex === -1) {
            return undefined;
        }

        const adjacentSegmentIndex =
            direction === RotationDirection.Clockwise
                ? segmentIndex === this.segments.length - 1
                    ? 0
                    : segmentIndex + 1
                : segmentIndex === 0
                  ? this.segments.length - 1
                  : segmentIndex - 1;

        return this.segments[adjacentSegmentIndex];
    }

    private _getRandomColorSeed(id: number): number {
        // Get a random seed based on the current time and the ID
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hour = String(now.getHours()).padStart(2, '0');
        const minute = String(now.getMinutes()).padStart(2, '0');

        return Number.parseInt(`${id}${year}${month}${day}${hour}${minute}`, 10);
    }

    private _getColors(segmentNames: string[], colorSchemeConfig: WheelColorConfig): TinyColor[] {
        switch (colorSchemeConfig.wheelColorType) {
            case WheelColorType.Monochromatic: {
                if (colorSchemeConfig.randomizeColor) {
                    return WheelManager._getRandomizedColors(
                        new TinyColor(colorSchemeConfig.baseColor).monochromatic(segmentNames.length)
                    );
                } else {
                    const colors = this._sortColors(
                        new TinyColor(colorSchemeConfig.baseColor).monochromatic(Math.ceil(segmentNames.length / 2) + 1)
                    );
                    const reverseColors: TinyColor[] = [];
                    for (const [i] of colors.entries()) {
                        if (
                            colors[colors.length - (i + 2)] &&
                            colors.length + reverseColors.length < segmentNames.length
                        ) {
                            reverseColors.push(colors[colors.length - (i + 2)]);
                        }
                    }
                    return [...colors, ...reverseColors];
                }
            }
            case WheelColorType.Analogous: {
                if (colorSchemeConfig.randomizeColor) {
                    return WheelManager._getRandomizedColors(
                        new TinyColor(colorSchemeConfig.baseColor).analogous(segmentNames.length)
                    );
                } else {
                    const colors = new TinyColor(colorSchemeConfig.baseColor)
                        .analogous(Math.ceil(segmentNames.length / 2) + 2)
                        .slice(1);
                    const reverseColors: TinyColor[] = [];
                    for (const [i] of colors.entries()) {
                        if (
                            colors[colors.length - (i + 2)] &&
                            colors.length + reverseColors.length < segmentNames.length
                        ) {
                            reverseColors.push(colors[colors.length - (i + 2)]);
                        }
                    }
                    return [...colors, ...reverseColors];
                }
            }
            case WheelColorType.Triad: {
                return new TinyColor(colorSchemeConfig.baseColor).triad();
            }
            case WheelColorType.Tetrad: {
                return new TinyColor(colorSchemeConfig.baseColor).tetrad();
            }
            case WheelColorType.Custom: {
                return colorSchemeConfig.colors.map((color) => new TinyColor(color));
            }
            default: {
                return segmentNames.map((_, i) => {
                    return random({
                        seed: this._getRandomColorSeed(i),
                        luminosity: i % 2 === 0 ? 'dark' : 'bright',
                    });
                });
            }
        }
    }

    private _sortColors(colors: TinyColor[]): TinyColor[] {
        return colors.sort(function (a, b) {
            return a.getBrightness() - b.getBrightness();
        });
    }
}
