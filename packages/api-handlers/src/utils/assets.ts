export function getAssetURL(reqUrl: string, asset: string): string {
    const url = new URL(reqUrl);
    const origin = `${url.protocol}//${url.host}`;

    let slash = '';
    if (!asset.startsWith('/')) {
        slash = '/';
    }

    return `${origin}${slash}${asset}`;
}
