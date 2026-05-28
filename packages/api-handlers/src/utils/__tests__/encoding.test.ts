import { Config } from '@repo/shared/classes/config';
import { SerializedConfigManager } from '@repo/shared/types/config';
import { decodeConfig, encodeConfig } from '@/utils/encoding.js';

let input: SerializedConfigManager;

beforeEach(() => {
    const config = new Config();
    config.setTitle('Test Title');
    config.setDescription('Test Description');
    config.setNames('Name 1\nName 2\nName 3');
    config.setRandomizeOrder(true);
    config.setShowNames(true);

    input = config.serialize();
});

describe('encodeConfig', () => {
    it('should encode a SerializedConfigManager object to a v4 base64url string', async () => {
        const encoded = await encodeConfig(input);
        expect(typeof encoded).toBe('string');
        expect(encoded).toMatch(/^v4\.[A-Za-z0-9_-]+$/);
        expect(encoded).not.toContain('%');
        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(encoded).not.toContain('=');
    });
});

describe('decodeConfig', () => {
    it('should decode a v4 base64url string to a SerializedConfigManager object', async () => {
        const encoded = await encodeConfig(input);
        const decoded = await decodeConfig(encoded);
        expect(decoded).toEqual(input);
    });

    it('should throw an error for unsupported encoding versions', async () => {
        await expect(decodeConfig('v3.invalid_base64_string')).rejects.toThrow('Invalid config');
    });

    it('should throw an error for invalid v4 payloads', async () => {
        await expect(decodeConfig('v4.invalid_base64_string')).rejects.toThrow('Invalid config');
    });
});

describe('base64url payload edge cases', () => {
    it('round-trips configs of varying sizes, covering all base64 padding cases', async () => {
        const paddingRemainders = new Set<number>();

        for (let i = 0; i <= 40; i++) {
            const config = new Config();
            config.setTitle('T'.repeat(i));
            config.setNames(Array.from({ length: i }, (_, n) => `Name ${n}`).join('\n'));
            const serialized = config.serialize();

            const encoded = await encodeConfig(serialized);
            const body = encoded.slice('v4.'.length);
            paddingRemainders.add(body.length % 4);

            expect(encoded).not.toContain('+');
            expect(encoded).not.toContain('/');
            expect(encoded).not.toContain('=');

            const decoded = await decodeConfig(encoded);
            expect(decoded).toEqual(serialized);
        }

        // A base64 body length is always a multiple of 4. Stripping 0, 1, or 2 '=' padding
        // chars leaves a remainder of 0, 3, or 2 respectively. Confirm all are exercised so the
        // padding restoration in fromBase64Url is covered for every case.
        expect(paddingRemainders).toEqual(new Set([0, 2, 3]));
    });

    it('round-trips values containing URL-unsafe characters', async () => {
        const config = new Config();
        config.setTitle('a+b/c=d & é 日本語 <>?#');
        config.setDescription('special: +/= %20\nline breaks\ttabs');
        config.setNames('+++\n///\n===\n%%%');
        const serialized = config.serialize();

        const encoded = await encodeConfig(serialized);
        expect(encoded).toMatch(/^v4\.[A-Za-z0-9_-]+$/);
        expect(encoded).not.toContain('%');

        const decoded = await decodeConfig(encoded);
        expect(decoded).toEqual(serialized);
    });
});
