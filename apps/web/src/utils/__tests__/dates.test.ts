import { dateIsWithinLast5Minutes } from '@/utils/dates';

describe('dateIsWithinLast5Minutes', () => {
    beforeEach(() => {
        // Reset any date mocks before each test
        vi.restoreAllMocks();
    });

    it('should return true for a date exactly 5 minutes ago', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const fiveMinutesAgo = new Date('2025-06-21T11:55:00.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(fiveMinutesAgo);
        expect(result).toBe(true);
    });

    it('should return true for a date 1 minute ago', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const oneMinuteAgo = new Date('2025-06-21T11:59:00.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(oneMinuteAgo);
        expect(result).toBe(true);
    });

    it('should return true for a date 30 seconds ago', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const thirtySecondsAgo = new Date('2025-06-21T11:59:30.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(thirtySecondsAgo);
        expect(result).toBe(true);
    });

    it('should return true for the current time', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(mockNow);
        expect(result).toBe(true);
    });

    it('should return false for a date 6 minutes ago', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const sixMinutesAgo = new Date('2025-06-21T11:54:00.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(sixMinutesAgo);
        expect(result).toBe(false);
    });

    it('should return false for a date 10 minutes ago', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const tenMinutesAgo = new Date('2025-06-21T11:50:00.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(tenMinutesAgo);
        expect(result).toBe(false);
    });

    it('should return false for a future date', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const futureDate = new Date('2025-06-21T12:01:00.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(futureDate);
        expect(result).toBe(false);
    });

    it('should return false for a date exactly 5 minutes and 1 millisecond ago', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const justOverFiveMinutesAgo = new Date('2025-06-21T11:54:59.999Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(justOverFiveMinutesAgo);
        expect(result).toBe(false);
    });

    it('should handle millisecond precision correctly', () => {
        const mockNow = new Date('2025-06-21T12:00:00.500Z');
        const exactlyFiveMinutesAgo = new Date('2025-06-21T11:55:00.500Z');
        const justUnderFiveMinutesAgo = new Date('2025-06-21T11:55:00.501Z');

        vi.setSystemTime(mockNow);

        expect(dateIsWithinLast5Minutes(exactlyFiveMinutesAgo)).toBe(true);
        expect(dateIsWithinLast5Minutes(justUnderFiveMinutesAgo)).toBe(true);
    });

    it('should work with Date objects across different time zones', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        // Create a date that's 3 minutes ago using a different constructor method
        const threeMinutesAgo = new Date(mockNow.getTime() - 3 * 60 * 1000);

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(threeMinutesAgo);
        expect(result).toBe(true);
    });

    it('should handle very old dates', () => {
        const mockNow = new Date('2025-06-21T12:00:00.000Z');
        const veryOldDate = new Date('2020-01-01T00:00:00.000Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(veryOldDate);
        expect(result).toBe(false);
    });

    it('should handle dates with different millisecond values', () => {
        const mockNow = new Date('2025-06-21T12:00:00.123Z');
        const dateWithDifferentMs = new Date('2025-06-21T11:58:30.456Z');

        vi.setSystemTime(mockNow);

        const result = dateIsWithinLast5Minutes(dateWithDifferentMs);
        expect(result).toBe(true);
    });
});
