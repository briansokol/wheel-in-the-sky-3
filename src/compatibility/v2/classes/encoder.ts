/**
 * Class providing URL encoding and decoding functionalities.
 * @deprecated Use encoding utils and hooks instead.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class Encoder {
    /**
     * Encodes an input object to a URL-safe base64 string.
     *
     * @template T - The type of the input object.
     * @param {T} input - The input object to be encoded.
     * @returns {string} The URL-safe base64 encoded string.
     */
    public static urlEncode<T>(input: T): string {
        return Encoder._btoa(
            encodeURIComponent(JSON.stringify(input)).replaceAll(/%([0-9A-F]{2})/g, (_, p1) =>
                String.fromCharCode(Number('0x' + p1))
            )
        );
    }

    /**
     * Decodes a URL-safe base64 string to an object.
     *
     * @template T - The type of the output object.
     * @param {string} input - The URL-safe base64 string to be decoded.
     * @returns {T} The decoded object.
     */
    public static urlDecode<T>(input: string): T {
        return JSON.parse(
            decodeURIComponent(
                Encoder._atob(input)
                    .split('')
                    .map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    })
                    .join('')
            )
        );
    }

    /**
     * Encodes a string to base64.
     *
     * @param {string} input - The string to be encoded.
     * @returns {string} The base64 encoded string.
     * @private
     */
    private static _btoa(input: string): string {
        return typeof globalThis === 'undefined'
            ? Buffer.from(input, 'binary').toString('base64')
            : globalThis.btoa(input);
    }

    /**
     * Decodes a base64 string to a binary string.
     *
     * @param {string} input - The base64 string to be decoded.
     * @returns {string} The decoded binary string.
     * @private
     */
    private static _atob(input: string): string {
        return typeof globalThis === 'undefined'
            ? Buffer.from(input, 'base64').toString('binary')
            : globalThis.atob(input);
    }
}
