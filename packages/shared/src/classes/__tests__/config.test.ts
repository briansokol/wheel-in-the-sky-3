import { Config } from '@/classes/config.js';
import { defaultPageColorConfig } from '@/constants/colors.js';
import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { SerializedConfigManager } from '@/types/config.js';
import { defaultWheelColorConfig } from '@/types/wheel-colors.js';

describe('Config', () => {
    let config: Config;

    beforeEach(() => {
        config = new Config();
    });

    it('should initialize with default values', () => {
        expect(config.version).toBe(3);
        expect(config.id).not.toBe('');
        expect(typeof config.id).toBe('string');
        expect(config.title).toBe('');
        expect(config.description).toBe('');
        expect(config.names).toEqual([]);
        expect(config.randomizeOrder).toBe(true);
        expect(config.showNames).toBe(true);
        expect(config.wheelColorConfig).toEqual(defaultWheelColorConfig);
        expect(config.pageColorConfig).toEqual(defaultPageColorConfig);
    });

    it('should generate a new id when addId is called', () => {
        const oldId = config.id;
        config.addId();
        expect(config.id).not.toBe('');
        expect(config.id).not.toBe(oldId);
        expect(typeof config.id).toBe('string');
    });

    it('should set title correctly', () => {
        config.setTitle('New Title');
        expect(config.title).toBe('New Title');
    });

    it('should set description correctly', () => {
        config.setDescription('New Description');
        expect(config.description).toBe('New Description');
    });

    it('should set names correctly from a string', () => {
        config.setNames('Name1\nName2\nName3');
        expect(config.names).toEqual(['Name1', 'Name2', 'Name3']);
    });

    it('should set names correctly from an array', () => {
        config.setNamesArray(['Name1', 'Name2', 'Name3']);
        expect(config.names).toEqual(['Name1', 'Name2', 'Name3']);
    });

    it('should set randomizeOrder correctly', () => {
        config.setRandomizeOrder(false);
        expect(config.randomizeOrder).toBe(false);
        config.setRandomizeOrder(true);
        expect(config.randomizeOrder).toBe(true);
    });

    it('should set showNames correctly', () => {
        config.setShowNames(false);
        expect(config.showNames).toBe(false);
        config.setShowNames(true);
        expect(config.showNames).toBe(true);
    });

    it('should set wheelColorType correctly', () => {
        config.setWheelColorType(WheelColorType.Monochromatic);
        expect(config.wheelColorConfig.wheelColorType).toBe(WheelColorType.Monochromatic);
        config.setWheelColorType(WheelColorType.Custom);
        expect(config.wheelColorConfig.wheelColorType).toBe(WheelColorType.Custom);
    });

    it('should set wheelColorBaseColor correctly', () => {
        config.setWheelColorBaseColor('#FFFFFF');
        expect(config.wheelColorConfig.baseColor).toBe('#FFFFFF');
        config.setWheelColorBaseColor('#BBBBBB');
        expect(config.wheelColorConfig.baseColor).toBe('#BBBBBB');
    });

    it('should set wheelColorRandomizeColor correctly', () => {
        config.setWheelColorRandomizeColor(false);
        expect(config.wheelColorConfig.randomizeColor).toBe(false);
        config.setWheelColorRandomizeColor(true);
        expect(config.wheelColorConfig.randomizeColor).toBe(true);
    });

    it('should set wheelColorColors correctly', () => {
        config.setWheelColorColors(['#FFFFFF', '#000000']);
        expect(config.wheelColorConfig.colors).toEqual(['#FFFFFF', '#000000']);
        config.setWheelColorColors(['#111111', '#555555']);
        expect(config.wheelColorConfig.colors).toEqual(['#111111', '#555555']);
    });

    it('should set pageColorType correctly', () => {
        config.setPageColorType(PageColorType.GradientDawn);
        expect(config.pageColorConfig.backgroundColorType).toBe(PageColorType.GradientDawn);
        config.setPageColorType(PageColorType.Single);
        expect(config.pageColorConfig.backgroundColorType).toBe(PageColorType.Single);
    });

    it('should set backgroundColor correctly', () => {
        config.setBackgroundColor('#FFFFFF');
        expect(config.pageColorConfig.backgroundColor).toBe('#FFFFFF');
        config.setBackgroundColor('#555555');
        expect(config.pageColorConfig.backgroundColor).toBe('#555555');
    });

    it('should set foregroundColor correctly', () => {
        config.setForegroundColor('#000000');
        expect(config.pageColorConfig.foregroundColor).toBe('#000000');
        config.setForegroundColor('#AAAAAA');
        expect(config.pageColorConfig.foregroundColor).toBe('#AAAAAA');
    });

    it('should serialize correctly', () => {
        const serialized = config.serialize();
        expect(serialized).toEqual({
            version: 3,
            id: config.id,
            title: '',
            description: '',
            names: [],
            randomizeOrder: true,
            showNames: true,
            wheelColorConfig: defaultWheelColorConfig,
            pageColorConfig: defaultPageColorConfig,
        });
    });

    it('should deserialize correctly', () => {
        const serializedConfig: SerializedConfigManager = {
            version: 3,
            id: 'test-id',
            title: 'Test Title',
            description: 'Test Description',
            names: ['Name1', 'Name2'],
            randomizeOrder: false,
            showNames: false,
            wheelColorConfig: {
                wheelColorType: WheelColorType.Random,
                baseColor: '#FFFFFF',
                randomizeColor: false,
                colors: ['#FFFFFF', '#000000'],
            },
            pageColorConfig: {
                backgroundColorType: PageColorType.GradientNight,
                backgroundColor: '#FFFFFF',
                foregroundColor: '#000000',
            },
        };
        config.deserialize(serializedConfig);
        expect(config.version).toBe(3);
        expect(config.id).toBe('test-id');
        expect(config.title).toBe('Test Title');
        expect(config.description).toBe('Test Description');
        expect(config.names).toEqual(['Name1', 'Name2']);
        expect(config.randomizeOrder).toBe(false);
        expect(config.showNames).toBe(false);
        expect(config.wheelColorConfig).toEqual(serializedConfig.wheelColorConfig);
        expect(config.pageColorConfig).toEqual(serializedConfig.pageColorConfig);
    });
});
