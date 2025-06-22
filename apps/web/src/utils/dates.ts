/**
 * Determines if a given date is within the last 5 minutes from the current time.
 *
 * @param date - The date to check
 * @returns True if the date is within the last 5 minutes (inclusive), false otherwise
 */
export function dateIsWithinLast5Minutes(date: Date): boolean {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return date >= fiveMinutesAgo && date <= now;
}
