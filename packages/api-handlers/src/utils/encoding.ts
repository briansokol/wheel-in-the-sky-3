import { SerializedConfigManager } from '@repo/shared/types/config';

/**
 * Compresses and encodes the input object to a base64 string.
 *
 * @param {SerializedConfigManager} input - The input object to be encoded.
 * @returns {Promise<string>} The compressed and encoded base64 string.
 */
export async function encodeConfig(input: SerializedConfigManager): Promise<string> {
    const compressedBuffer = await compressWithGzip(JSON.stringify(input));
    return encodeURIComponent(compressedBuffer);
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
        const decompressedText = await decompressFromGzip(decodedInput);
        return JSON.parse(decompressedText);
    } catch {
        throw new Error('Invalid config');
    }
}

/**
 * Compresses a string using CompressionStream with gzip.
 *
 * @param {string} input - The string to be compressed.
 * @returns {Promise<string>} A base64 encoded string of the gzipped content.
 */
export async function compressWithGzip(input: string): Promise<string> {
    // Create a ReadableStream from the input string
    const textEncoder = new TextEncoder();
    const encodedData = textEncoder.encode(input);
    const readableStream = new ReadableStream({
        start(controller) {
            controller.enqueue(encodedData);
            controller.close();
        },
    });

    // Compress the data using CompressionStream with gzip
    const compressedStream = readableStream.pipeThrough(new CompressionStream('gzip'));

    // Convert the compressed stream to a Uint8Array
    const reader = compressedStream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    // Combine all chunks into a single Uint8Array
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedChunks = new Uint8Array(totalLength);

    let offset = 0;
    for (const chunk of chunks) {
        combinedChunks.set(chunk, offset);
        offset += chunk.length;
    }

    // Convert to base64 and return
    return btoa(String.fromCharCode.apply(null, [...combinedChunks]));
}

/**
 * Decompresses a base64 encoded gzipped string back to the original string.
 *
 * @param {string} input - The base64 encoded gzipped string to be decompressed.
 * @returns {Promise<string>} The original decompressed string.
 * @throws {Error} If the decompression fails.
 */
export async function decompressFromGzip(input: string): Promise<string> {
    try {
        // Convert base64 string to Uint8Array
        const binaryString = atob(input);
        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create a ReadableStream from the byte array
        const readableStream = new ReadableStream({
            start(controller) {
                controller.enqueue(bytes);
                controller.close();
            },
        });

        // Decompress the data using DecompressionStream with gzip
        const decompressedStream = readableStream.pipeThrough(new DecompressionStream('gzip'));

        // Read all chunks from the decompressed stream
        const reader = decompressedStream.getReader();
        const chunks: Uint8Array[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        // Combine all chunks into a single Uint8Array
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedChunks = new Uint8Array(totalLength);

        let offset = 0;
        for (const chunk of chunks) {
            combinedChunks.set(chunk, offset);
            offset += chunk.length;
        }

        // Decode the Uint8Array back to a string
        const textDecoder = new TextDecoder();
        return textDecoder.decode(combinedChunks);
    } catch (error) {
        throw new Error(`Failed to decompress gzip string: ${error}`);
    }
}
