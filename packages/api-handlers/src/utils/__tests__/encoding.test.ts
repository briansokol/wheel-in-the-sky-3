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
    it('should encode a SerializedConfigManager object to a base64 string', async () => {
        const encoded = await encodeConfig(input);
        expect(typeof encoded).toBe('string');
        expect(encoded).toMatch(/%[0-9A-F]{2}/i); // Check if the string is URL-encoded
    });
});

describe('decodeConfig', () => {
    it('should decode a base64 string to a SerializedConfigManager object', async () => {
        const encoded = await encodeConfig(input);
        const decoded = await decodeConfig(encoded);
        expect(decoded).toEqual(input);
    });

    it('should throw an error for invalid base64 string', async () => {
        const invalidBase64 = 'invalid_base64_string';
        await expect(decodeConfig(invalidBase64)).rejects.toThrow();
    });
});
