import { TinyColor } from '@ctrl/tinycolor';

export class Segment {
    public readonly index: number;
    public readonly id: string;
    public readonly name: string;
    public readonly rotationStartAngle: number;
    public readonly rotationEndAngle: number;
    public readonly textColor: string;
    public readonly backgroundColor: string;
    public readonly degrees: number;
    public readonly legStart: number;
    public readonly legEnd: number;

    constructor(
        index: number,
        name: string,
        degrees: number,
        rotationStartAngle: number,
        rotationEndAngle: number,
        color?: TinyColor,
        textColor?: string,
        backgroundColor?: string
    ) {
        this.index = index;
        this.name = name;
        this.rotationStartAngle = rotationStartAngle;
        this.rotationEndAngle = rotationEndAngle;
        if (backgroundColor && textColor) {
            this.backgroundColor = backgroundColor;
            this.textColor = textColor;
        } else if (color instanceof TinyColor) {
            this.backgroundColor = color.toHexString();
            this.textColor = color.isLight() ? '#000000' : '#ffffff';
        } else {
            this.backgroundColor = '#000000';
            this.textColor = '#ffffff';
        }
        this.id = Math.random().toString(36).slice(2, 15);
        this.degrees = degrees;
        const clipHalfLength = this._calculateClipHalfLength(degrees);
        this.legStart = 50 - clipHalfLength;
        this.legEnd = 50 + clipHalfLength;
    }

    /**
     * Calculates half of the length between the start and end of the segment triangle leg.
     * This is used to create the top 2 points of a clip path for the segment.
     * Returns 0 if the segment is greater than or equal to a full circle.
     *
     * @param degrees - The angular size of the segment in degrees
     * @returns {number} The length of the segment's leg as a percentage (0-100)
     * @private
     */
    private _calculateClipHalfLength(degrees: number): number {
        if (degrees >= 180) {
            return 0;
        }

        const radians = ((degrees / 2) * Math.PI) / 180;
        return Math.round(Math.tan(radians) * 50 * 100_000) / 100_000;
    }
}
