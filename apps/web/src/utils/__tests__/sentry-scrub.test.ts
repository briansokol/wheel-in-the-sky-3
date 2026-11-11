import { describe, expect, it } from 'vitest';
import { scrubEncodedConfig } from '@/utils/sentry-scrub';

describe('scrubEncodedConfig', () => {
    it.each([
        ['https://x.app/wheel#c=v5.abc', 'https://x.app/wheel#c=[redacted]'],
        ['https://x.app/wheel#utm=1&c=v5.abc', 'https://x.app/wheel#utm=1&c=[redacted]'],
        ['/config#c=v5.abc&utm=1', '/config#c=[redacted]&utm=1'],
        ['https://x.app/wheel?c=v5.abc', 'https://x.app/wheel?c=[redacted]'],
        ['https://x.app/about', 'https://x.app/about'],
        ['https://x.app/?topic=1', 'https://x.app/?topic=1'],
    ])('scrubs %s', (input, expected) => {
        expect(scrubEncodedConfig(input)).toBe(expected);
    });
});
