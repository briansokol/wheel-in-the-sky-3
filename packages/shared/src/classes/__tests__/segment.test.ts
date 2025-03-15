import { TinyColor } from '@ctrl/tinycolor';
import { Segment } from '@/classes/segment.js';

describe('Segment', () => {
    it('should create a segment with the correct properties', () => {
        const color = new TinyColor('#FF0000');
        const segment = new Segment(0, 'Test Segment', 30, 0, 30, color);

        expect(segment.index).toBe(0);
        expect(segment.name).toBe('Test Segment');
        expect(segment.degrees).toBe(30);
        expect(segment.rotationStartAngle).toBe(0);
        expect(segment.rotationEndAngle).toBe(30);
        expect(segment.backgroundColor).toBe('#ff0000');
        expect(segment.textColor).toBe('#ffffff');
        expect(segment.id).toBeDefined();
        expect(segment.legStart).toBeCloseTo(36.602_54);
        expect(segment.legEnd).toBeCloseTo(63.397_46);
    });

    it('should use provided textColor and backgroundColor', () => {
        const segment = new Segment(1, 'Test Segment', 45, 30, 75, undefined, '#000000', '#FFFFFF');

        expect(segment.textColor).toBe('#000000');
        expect(segment.backgroundColor).toBe('#FFFFFF');
    });

    it('should use default colors if no color is provided', () => {
        const segment = new Segment(2, 'Test Segment', 60, 45, 105);

        expect(segment.textColor).toBe('#ffffff');
        expect(segment.backgroundColor).toBe('#000000');
    });

    it('should calculate legStart and legEnd correctly', () => {
        const segment = new Segment(3, 'Test Segment', 90, 60, 150);

        expect(segment.legStart).toBeCloseTo(0);
        expect(segment.legEnd).toBeCloseTo(100);
    });
});
