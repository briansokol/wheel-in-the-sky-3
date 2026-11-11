import { Config } from '@/classes/config.js';
import { MAX_DECODED_BYTES, MAX_ENCODED_LENGTH } from '@/constants/limits.js';
import { fromWireConfig, toWireConfig } from '@/utils/wire-config.js';
import { wireConfigSchema } from '@/validators/wire-config.js';

export const CONFIG_ENCODING_VERSION = 'v5.';

const BINARY_STRING_CHUNK_SIZE = 0x8000;

/**
 * Compresses a config into a versioned base64url string for share links.
 */
export async function encodeConfig(config: Config): Promise<string> {
    const json = new TextEncoder().encode(JSON.stringify(toWireConfig(config)));
    const compressed = await readAll(streamOf(json).pipeThrough(new CompressionStream('deflate-raw')));
    return `${CONFIG_ENCODING_VERSION}${toBase64Url(compressed)}`;
}

/**
 * Decodes and validates a share-link config string.
 *
 * @throws {Error} `Invalid config`, with the underlying failure as its cause,
 * for any input that is too large, malformed, or fails validation.
 */
export async function decodeConfig(encodedConfig: string): Promise<Config> {
    try {
        if (encodedConfig.length > MAX_ENCODED_LENGTH) {
            throw new Error('Encoded config is too long');
        }
        if (!encodedConfig.startsWith(CONFIG_ENCODING_VERSION)) {
            throw new Error('Unsupported config encoding version');
        }

        const compressed = fromBase64Url(encodedConfig.slice(CONFIG_ENCODING_VERSION.length));
        const json = await readAll(
            streamOf(compressed).pipeThrough(new DecompressionStream('deflate-raw')),
            MAX_DECODED_BYTES
        );
        return fromWireConfig(wireConfigSchema.parse(JSON.parse(new TextDecoder().decode(json))));
    } catch (error) {
        throw new Error('Invalid config', { cause: error });
    }
}

function streamOf(bytes: Uint8Array<ArrayBuffer>): ReadableStream<Uint8Array<ArrayBuffer>> {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(bytes);
            controller.close();
        },
    });
}

/**
 * Reads a byte stream to the end, cancelling it once it exceeds `maxBytes`.
 */
async function readAll(stream: ReadableStream<Uint8Array>, maxBytes = Infinity): Promise<Uint8Array<ArrayBuffer>> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalLength += value.length;
        if (totalLength > maxBytes) {
            await reader.cancel();
            throw new Error('Decoded config is too large');
        }
        chunks.push(value);
    }

    const bytes = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
    }
    return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
    // Converted in chunks: spreading a large array into one call overflows the stack.
    let binary = '';
    for (let i = 0; i < bytes.length; i += BINARY_STRING_CHUNK_SIZE) {
        binary += String.fromCharCode(...bytes.subarray(i, i + BINARY_STRING_CHUNK_SIZE));
    }
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function fromBase64Url(input: string): Uint8Array<ArrayBuffer> {
    const base64 = input.replaceAll('-', '+').replaceAll('_', '/');
    const binary = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
