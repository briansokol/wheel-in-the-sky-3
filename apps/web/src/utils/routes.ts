import { PageBaseRoute } from '../constants/routes';

export function isPage(pathname: string, page: PageBaseRoute): boolean {
    if (!pathname) {
        return false;
    }

    if (page === PageBaseRoute.Home) {
        return pathname === page;
    }
    return pathname === page || pathname.startsWith(`${page}/`) || pathname.startsWith(`${page}?`);
}

/**
 * Reads the encoded wheel config from a URL fragment such as `#c=v5.abc&utm=1`.
 */
export function getEncodedConfigFromHash(hash: string): string | undefined {
    return new URLSearchParams(hash.slice(1)).get('c') || undefined;
}

export function buildConfigHash(encodedConfig: string): string {
    return `#c=${encodedConfig}`;
}
