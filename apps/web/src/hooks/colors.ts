import { useEffect, useMemo } from 'react';
import { Config } from '@/classes/config';
import { defaultPageColorConfig } from '@/constants/colors';
import { PageColorType } from '@/enums/page-colors';

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
        document.documentElement.style.setProperty('--page-background', bgColor);
    }, [bgColor]);
}

export function useSetDocumentForegroundColor(fgColor: string) {
    useEffect(() => {
        document.documentElement.style.setProperty('--page-foreground', fgColor);
    }, [fgColor]);
}
