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
