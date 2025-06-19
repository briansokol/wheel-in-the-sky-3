export interface ConfigV2QueryParams {
    id?: string;
    title: string;
    description: string;
    names: string;
    randomizeOrder: boolean;
    showNames: boolean;
    colorSchemeConfig: string;
    backgroundColorConfig: string;
}

export enum BackgroundColorType {
    Default,
    Single,
}

export interface IBackgroundColorConfig {
    backgroundColorType: BackgroundColorType;
    color?: string;
}

export interface BackgroundColorDefaultConfig extends IBackgroundColorConfig {
    backgroundColorType: BackgroundColorType.Default;
}

export interface BackgroundColorSingleConfig extends IBackgroundColorConfig {
    backgroundColorType: BackgroundColorType.Single;
    color: string;
}

export type BackgroundColorConfig = BackgroundColorDefaultConfig | BackgroundColorSingleConfig;

export enum ColorSchemeType {
    Random,
    Monochromatic,
    Analogous,
    Triad,
    Tetrad,
    Custom,
}

export interface IColorSchemeConfig {
    colorSchemeType: ColorSchemeType;
    baseColor?: string;
    randomizeColor?: boolean;
    colors?: string[];
}

export interface ColorSchemeRandomConfig extends IColorSchemeConfig {
    colorSchemeType: ColorSchemeType.Random;
}

export interface ColorSchemeMonochromaticConfig extends IColorSchemeConfig {
    colorSchemeType: ColorSchemeType.Monochromatic;
    baseColor: string;
    randomizeColor: boolean;
}

export interface ColorSchemeAnalogousConfig extends IColorSchemeConfig {
    colorSchemeType: ColorSchemeType.Analogous;
    baseColor: string;
    randomizeColor: boolean;
}

export interface ColorSchemeTriadConfig extends IColorSchemeConfig {
    colorSchemeType: ColorSchemeType.Triad;
    baseColor: string;
}

export interface ColorSchemeTetradConfig extends IColorSchemeConfig {
    colorSchemeType: ColorSchemeType.Tetrad;
    baseColor: string;
}

export interface ColorSchemeCustomConfig extends IColorSchemeConfig {
    colorSchemeType: ColorSchemeType.Custom;
    colors: string[];
}

export type ColorSchemeConfig =
    | ColorSchemeRandomConfig
    | ColorSchemeMonochromaticConfig
    | ColorSchemeAnalogousConfig
    | ColorSchemeTriadConfig
    | ColorSchemeTetradConfig
    | ColorSchemeCustomConfig;
