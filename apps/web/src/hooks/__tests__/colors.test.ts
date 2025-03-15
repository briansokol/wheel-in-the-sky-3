import { Config } from '@repo/shared/classes/config';
import { defaultPageColorConfig } from '@repo/shared/constants/colors';
import { PageColorType } from '@repo/shared/enums/page-colors';
import { renderHook } from '@testing-library/react';
import { useBgColor, useFgColor, useSetDocumentBackgroundColor, useSetDocumentForegroundColor } from '../colors';

describe('useBgColor', () => {
    it('should return the background color for Single type', () => {
        const config = new Config();
        config.pageColorConfig.backgroundColorType = PageColorType.Single;
        const { result } = renderHook(() => useBgColor(config, '#FFFFFF'));
        expect(result.current).toBe('#FFFFFF');
    });

    it('should return the background color from config for Gradient types', () => {
        const config = new Config();
        config.pageColorConfig.backgroundColorType = PageColorType.GradientNight;
        config.pageColorConfig.backgroundColor = '#000000';
        const { result } = renderHook(() => useBgColor(config, '#FFFFFF'));
        expect(result.current).toBe('#000000');
    });

    it('should return the default background color for unknown types', () => {
        const config = new Config();
        // @ts-expect-error Testing an invalid type
        config.pageColorConfig.backgroundColorType = 'UnknownType' as PageColorType;
        const { result } = renderHook(() => useBgColor(config, '#FFFFFF'));
        expect(result.current).toBe(defaultPageColorConfig.backgroundColor);
    });
});

describe('useFgColor', () => {
    it('should return the foreground color for Single type', () => {
        const config = new Config();
        config.pageColorConfig.backgroundColorType = PageColorType.Single;
        const { result } = renderHook(() => useFgColor(config, '#000000'));
        expect(result.current).toBe('#000000');
    });

    it('should return the foreground color from config for Gradient types', () => {
        const config = new Config();
        config.pageColorConfig.backgroundColorType = PageColorType.GradientNight;
        config.pageColorConfig.foregroundColor = '#FFFFFF';
        const { result } = renderHook(() => useFgColor(config, '#000000'));
        expect(result.current).toBe('#FFFFFF');
    });

    it('should return the default foreground color for unknown types', () => {
        const config = new Config();
        // @ts-expect-error Testing an invalid type
        config.pageColorConfig.backgroundColorType = 'UnknownType' as PageColorType;
        const { result } = renderHook(() => useFgColor(config, '#000000'));
        expect(result.current).toBe(defaultPageColorConfig.foregroundColor);
    });
});

describe('useSetDocumentBackgroundColor', () => {
    it('should set the document background color', () => {
        renderHook(() => useSetDocumentBackgroundColor('#FFFFFF'));
        expect(document.documentElement.style.getPropertyValue('--background')).toBe('#FFFFFF');
    });
});

describe('useSetDocumentForegroundColor', () => {
    it('should set the document foreground color', () => {
        renderHook(() => useSetDocumentForegroundColor('#000000'));
        expect(document.documentElement.style.getPropertyValue('--foreground')).toBe('#000000');
    });
});
