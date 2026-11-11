import { Config } from '@/classes/config.js';
import { MAX_DECODED_BYTES, MAX_ENCODED_LENGTH, MAX_NAMES, MAX_NAME_LENGTH } from '@/constants/limits.js';
import { CONFIG_ENCODING_VERSION, decodeConfig, encodeConfig } from '@/utils/encoding.js';

function makeConfig(names: string): Config {
    return new Config().setTitle('Standup').setNames(names);
}

/**
 * Builds a syntactically valid link around an arbitrary payload. Uses Web APIs
 * only, because this package is typed without Node.
 */
async function wrap(payload: string | Uint8Array<ArrayBuffer>): Promise<string> {
    const bytes = typeof payload === 'string' ? new TextEncoder().encode(payload) : payload;
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer());
    const base64 = btoa(Array.from(compressed, (byte) => String.fromCharCode(byte)).join(''));
    return `${CONFIG_ENCODING_VERSION}${base64.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`;
}

describe('encodeConfig', () => {
    it('produces a versioned base64url string', async () => {
        expect(await encodeConfig(makeConfig('A\nB'))).toMatch(/^v5\.[A-Za-z0-9_-]+$/);
    });
});

describe('decodeConfig', () => {
    it('round-trips a config', async () => {
        const config = makeConfig('A\nB\nC');
        expect((await decodeConfig(await encodeConfig(config))).serialize()).toEqual(config.serialize());
    });

    it('round-trips unicode and emoji names', async () => {
        const config = makeConfig('Zoë\n田中\n🎉 Party');
        expect((await decodeConfig(await encodeConfig(config))).names).toEqual(['Zoë', '田中', '🎉 Party']);
    });

    it('round-trips a maximum-size wheel', async () => {
        const names = Array.from({ length: MAX_NAMES }, (_, i) => `${i}`.padEnd(MAX_NAME_LENGTH, 'x'));
        const config = makeConfig(names.join('\n'));
        expect((await decodeConfig(await encodeConfig(config))).names).toHaveLength(MAX_NAMES);
    });

    it.each([
        ['the old v4 prefix', 'v4.H4sIAAAAAAAAA6tWKkktLlGyUlAqS8wpTgUAEq0RXhQAAAA'],
        ['a string with no prefix', 'abc'],
        ['invalid base64', 'v5.!!!!'],
        ['valid JSON that fails the schema', () => wrap(JSON.stringify({ i: 'abc', n: [] }))],
        ['a non-JSON payload', () => wrap('not json')],
        ['an over-long input', `v5.${'A'.repeat(MAX_ENCODED_LENGTH)}`],
        ['a payload that inflates past the cap', () => wrap(new Uint8Array(MAX_DECODED_BYTES + 1).fill(0x20))],
    ])('rejects %s', async (_label, input) => {
        const encoded = typeof input === 'string' ? input : await input();
        await expect(decodeConfig(encoded)).rejects.toThrow('Invalid config');
    });

    it('refuses over-long input before decoding it', async () => {
        await expect(decodeConfig(`v5.${'A'.repeat(MAX_ENCODED_LENGTH)}`)).rejects.toMatchObject({
            cause: { message: 'Encoded config is too long' },
        });
    });

    it('stops inflating once the payload passes the cap', async () => {
        const encoded = await wrap(new Uint8Array(MAX_DECODED_BYTES + 1).fill(0x20));
        await expect(decodeConfig(encoded)).rejects.toMatchObject({
            cause: { message: 'Decoded config is too large' },
        });
    });

    it('rejects a truncated string', async () => {
        const encoded = await encodeConfig(makeConfig('A\nB\nC'));
        await expect(decodeConfig(encoded.slice(0, -8))).rejects.toThrow('Invalid config');
    });
});
