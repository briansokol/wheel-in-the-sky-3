export function dateIsWithinLast5Minutes(date: Date): boolean {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    return date >= fiveMinutesAgo;
}
