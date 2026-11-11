import { useLocation } from 'react-router';
import { getEncodedConfigFromHash } from '@/utils/routes';

/**
 * Returns the encoded wheel config carried in the current URL fragment.
 */
export function useEncodedConfig(): string | undefined {
    return getEncodedConfigFromHash(useLocation().hash);
}
