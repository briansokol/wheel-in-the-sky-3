/**
 * Redacts the encoded wheel config (`c=`) from a URL so wheel contents are
 * not sent to Sentry.
 */
export function scrubEncodedConfig(url: string): string {
    return url.replace(/([#&?]c=)[^&#]*/, '$1[redacted]');
}
