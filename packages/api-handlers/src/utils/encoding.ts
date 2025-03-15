import { SerializedConfigManager } from '@repo/shared/types/config';
import zlib from 'node:zlib';

/**
 * Compresses and encodes the input object to a base64 string.
 *
 * @param {SerializedConfigManager} input - The input object to be encoded.
 * @returns {Promise<string>} The compressed and encoded base64 string.
 */
export async function encodeConfig(input: SerializedConfigManager): Promise<string> {
    const compressedBuffer = zlib.brotliCompressSync(JSON.stringify(input));
    return encodeURIComponent(compressedBuffer.toString('base64'));
}

/**
 * Decodes and decompresses the input base64 string to an object.
 *
 * @param {string} input - The base64 string to be decoded.
 * @returns {Promise<SerializedConfigManager>} The decoded and decompressed object.
 * @throws {Error} If the input string is invalid.
 */
export async function decodeConfig(input: string): Promise<SerializedConfigManager> {
    try {
        const decodedInput = decodeURIComponent(input);
        const base64Buffer = Buffer.from(decodedInput, 'base64');
        const decompressedText = zlib.brotliDecompressSync(base64Buffer).toString();
        return JSON.parse(decompressedText);
    } catch {
        throw new Error('Invalid config');
    }
}
