import { calculateStartingRotation } from '@/utils/math';

describe('calculateStartingRotation', () => {
    it('should return the correct starting rotation for a given input', () => {
        expect(calculateStartingRotation(1)).toBe(180);
        expect(calculateStartingRotation(2)).toBe(270);
        expect(calculateStartingRotation(4)).toBe(315);
        expect(calculateStartingRotation(5)).toBe(324);
        expect(calculateStartingRotation(10)).toBe(342);
        expect(calculateStartingRotation(100)).toBe(358.2);
    });

    it('should handle zero segments', () => {
        const result = calculateStartingRotation(0);
        expect(result).toBe(0);
    });

    it('should handle negative segments', () => {
        const result = calculateStartingRotation(-1);
        expect(result).toBe(0);
    });
});
