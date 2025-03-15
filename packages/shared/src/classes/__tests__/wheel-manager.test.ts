import { TinyColor } from '@ctrl/tinycolor';
import { Config } from '@/classes/config.js';
import { WheelManager } from '@/classes/wheel-manager.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { WheelColorConfig } from '@/types/wheel-colors.js';

describe('WheelManager', () => {
    let wheelManager: WheelManager;
    let config: Config;
    let segmentNames: string[];
    let wheelColorConfig: WheelColorConfig;

    beforeEach(() => {
        wheelManager = new WheelManager();
        segmentNames = ['Segment1', 'Segment2', 'Segment3', 'Segment4'];
        wheelColorConfig = {
            wheelColorType: WheelColorType.Monochromatic,
            baseColor: '#FF0000',
            randomizeColor: false,
            colors: ['#FF0000', '#00FF00', '#0000FF'],
        };
        config = new Config();
        config.setNames(segmentNames.join('\n'));
        config.setRandomizeOrder(false);
    });

    describe('getSegmentByRotation', () => {
        it('should return undefined if rotation is undefined', () => {
            const segment = wheelManager.getSegmentByRotation();
            expect(segment).toBeUndefined();
        });

        it('should return the correct segment for a given rotation', () => {
            wheelManager.init(config, []);
            const segmentArc = wheelManager.segmentArc;

            expect(wheelManager.getSegmentByRotation(0)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(0)?.name).toBe('Segment4');
            expect(wheelManager.getSegmentByRotation(segmentArc - 1)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(segmentArc - 1)?.name).toBe('Segment4');

            expect(wheelManager.getSegmentByRotation(segmentArc)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(segmentArc)?.name).toBe('Segment3');
            expect(wheelManager.getSegmentByRotation(segmentArc * 2 - 1)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(segmentArc * 2 - 1)?.name).toBe('Segment3');

            expect(wheelManager.getSegmentByRotation(segmentArc * 2)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(segmentArc * 2)?.name).toBe('Segment2');
            expect(wheelManager.getSegmentByRotation(segmentArc * 3 - 1)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(segmentArc * 3 - 1)?.name).toBe('Segment2');

            expect(wheelManager.getSegmentByRotation(segmentArc * 3)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(segmentArc * 3)?.name).toBe('Segment1');
            expect(wheelManager.getSegmentByRotation(segmentArc * 4 - 1)).not.toBeNull();
            expect(wheelManager.getSegmentByRotation(segmentArc * 4 - 1)?.name).toBe('Segment1');
        });

        it('should return undefined if no segment matches the rotation', () => {
            wheelManager.init(config, []);
            const segment = wheelManager.getSegmentByRotation(400);
            expect(segment).toBeUndefined();
        });
    });

    describe('_getColors', () => {
        it('should return monochromatic colors when wheelColorType is Monochromatic', () => {
            wheelColorConfig.wheelColorType = WheelColorType.Monochromatic;
            const colors = wheelManager['_getColors'](segmentNames, wheelColorConfig);
            expect(colors).toHaveLength(segmentNames.length);
        });

        it('should return analogous colors when wheelColorType is Analogous', () => {
            wheelColorConfig.wheelColorType = WheelColorType.Analogous;
            const colors = wheelManager['_getColors'](segmentNames, wheelColorConfig);
            expect(colors).toHaveLength(segmentNames.length);
        });

        it('should return triad colors when wheelColorType is Triad', () => {
            wheelColorConfig.wheelColorType = WheelColorType.Triad;
            const colors = wheelManager['_getColors'](segmentNames, wheelColorConfig);
            expect(colors).toHaveLength(3);
        });

        it('should return tetrad colors when wheelColorType is Tetrad', () => {
            wheelColorConfig.wheelColorType = WheelColorType.Tetrad;
            const colors = wheelManager['_getColors'](segmentNames, wheelColorConfig);
            expect(colors).toHaveLength(4);
        });

        it('should return custom colors when wheelColorType is Custom', () => {
            wheelColorConfig.wheelColorType = WheelColorType.Custom;
            const colors = wheelManager['_getColors'](segmentNames, wheelColorConfig);
            // @ts-expect-error undefined property should cause test to fail
            expect(colors).toEqual(wheelColorConfig.colors.map((color) => new TinyColor(color)));
        });

        it('should return randomized colors when randomizeColor is true', () => {
            wheelColorConfig.wheelColorType = WheelColorType.Monochromatic;
            wheelColorConfig.randomizeColor = true;
            const colors = wheelManager['_getColors'](segmentNames, wheelColorConfig);
            expect(colors).toHaveLength(segmentNames.length);
        });

        it('should return default random colors for unknown wheelColorType', () => {
            // @ts-expect-error testing unknown type
            wheelColorConfig.wheelColorType = 'UnknownType' as WheelColorType;
            const colors = wheelManager['_getColors'](segmentNames, wheelColorConfig);
            expect(colors).toHaveLength(segmentNames.length);
        });
    });
});
