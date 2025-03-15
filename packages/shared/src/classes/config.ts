import { nanoid } from 'nanoid';
import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { SerializedConfigManager } from '@/types/config.js';
import { PageColorConfig } from '@/types/page-colors.js';
import { WheelColorConfig, defaultWheelColorConfig } from '@/types/wheel-colors.js';
import { defaultPageColorConfig } from '../constants/colors.js';

export class Config {
    public static readonly queryKey = 'config';
    public static readonly oldQueryKey = 'options';
    public version = 3;
    public id = '';
    public title = '';
    public description = '';
    public names: string[] = [];
    public randomizeOrder = true;
    public showNames = true;
    public wheelColorConfig: WheelColorConfig = defaultWheelColorConfig;
    public pageColorConfig: PageColorConfig = defaultPageColorConfig;

    constructor() {
        this.addId();
    }

    public get fullTitle(): string {
        return this.title.length > 0 ? this.title : '';
    }

    public get namesString(): string {
        return this.names.join('\n');
    }

    public setTitle(title: string) {
        this.title = title;
        return this;
    }

    public setDescription(description: string) {
        this.description = description;
        return this;
    }

    public setNames(names: string) {
        this.names = names
            .split('\n')
            .map((name) => name.trim())
            .filter(Boolean);
        return this;
    }

    public setNamesArray(names: string[]) {
        this.names = names;
        return this;
    }

    public setRandomizeOrder(randomizeOrder: boolean) {
        this.randomizeOrder = randomizeOrder;
        return this;
    }

    public setShowNames(showNames: boolean) {
        this.showNames = showNames;
        return this;
    }

    public setWheelColorType(wheelColorType: WheelColorType) {
        this.wheelColorConfig.wheelColorType = wheelColorType;
        return this;
    }

    public setWheelColorBaseColor(baseColor: string) {
        this.wheelColorConfig.baseColor = baseColor;
        return this;
    }

    public setWheelColorRandomizeColor(randomizeColor: boolean) {
        this.wheelColorConfig.randomizeColor = randomizeColor;
        return this;
    }

    public setWheelColorColors(colors: string[]) {
        this.wheelColorConfig.colors = colors;
        return this;
    }

    public setPageColorType(pageColorType: PageColorType) {
        this.pageColorConfig.backgroundColorType = pageColorType;
        return this;
    }

    public setBackgroundColor(color: string) {
        this.pageColorConfig.backgroundColor = color;
        return this;
    }

    public setForegroundColor(color: string) {
        this.pageColorConfig.foregroundColor = color;
        return this;
    }

    public setId(id: string) {
        this.id = id;
        return this;
    }

    public addId(): void {
        this.id = nanoid();
    }

    public serialize(): SerializedConfigManager {
        return {
            version: this.version,
            id: this.id,
            title: this.title,
            description: this.description,
            names: this.names,
            randomizeOrder: this.randomizeOrder,
            showNames: this.showNames,
            wheelColorConfig: this.wheelColorConfig,
            pageColorConfig: this.pageColorConfig,
        };
    }

    public deserialize(serializedConfig: SerializedConfigManager): Config {
        // TODO: Add error handling, add Zod validation
        this.version = serializedConfig.version;
        this.id = serializedConfig.id ?? nanoid();
        this.title = serializedConfig.title ?? '';
        this.description = serializedConfig.description ?? '';
        this.names = serializedConfig.names ?? [];
        this.randomizeOrder = serializedConfig.randomizeOrder ?? true;
        this.showNames = serializedConfig.showNames ?? true;
        this.wheelColorConfig = serializedConfig.wheelColorConfig ?? defaultWheelColorConfig;
        this.pageColorConfig = serializedConfig.pageColorConfig ?? defaultPageColorConfig;
        return this;
    }
}
