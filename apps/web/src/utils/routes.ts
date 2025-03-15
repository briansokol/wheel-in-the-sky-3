import { PageBaseRoute } from '../constants/routes';

export function isPage(pathname: string, page: PageBaseRoute): boolean {
    if (!pathname) {
        return false;
    }

    if (page === PageBaseRoute.Home) {
        return pathname === page;
    }
    return pathname.startsWith(page);
}
