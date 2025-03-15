import { Config } from '@repo/shared/classes/config';
import { defaultPageColorConfig } from '@repo/shared/constants/colors';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { useEffect, useMemo } from 'react';

export function useBgColor(config: Config | undefined, backgroundColor: string) {
    return useMemo(() => {
        switch (config?.pageColorConfig?.backgroundColorType) {
            case PageColorType.Single: {
                return backgroundColor;
            }
            case PageColorType.GradientNight:
            case PageColorType.GradientDay:
            case PageColorType.GradientDawn:
            case PageColorType.GradientTwilight: {
                return config?.pageColorConfig.backgroundColor;
            }
            default: {
                return defaultPageColorConfig.backgroundColor;
            }
        }
    }, [config, backgroundColor]);
}

export function useFgColor(config: Config | undefined, foregroundColor: string) {
    return useMemo(() => {
        switch (config?.pageColorConfig?.backgroundColorType) {
            case PageColorType.Single: {
                return foregroundColor;
            }
            case PageColorType.GradientNight:
            case PageColorType.GradientDay:
            case PageColorType.GradientDawn:
            case PageColorType.GradientTwilight: {
                return config?.pageColorConfig.foregroundColor;
            }
            default: {
                return defaultPageColorConfig.foregroundColor;
            }
        }
    }, [config, foregroundColor]);
}

export function useSetDocumentBackgroundColor(bgColor: string) {
    useEffect(() => {
        document.documentElement.style.setProperty('--background', bgColor);
    }, [bgColor]);
}

export function useSetDocumentForegroundColor(fgColor: string) {
    useEffect(() => {
        document.documentElement.style.setProperty('--foreground', fgColor);
    }, [fgColor]);
}
