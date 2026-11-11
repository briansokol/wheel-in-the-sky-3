import { Config } from '@/classes/config.js';
import { INVERSE_FOREGROUND_COLOR } from '@/constants/colors.js';
import { CONFIG_ID_LENGTH, MAX_NAMES, MAX_NAME_LENGTH } from '@/constants/limits.js';
import { PageColorType } from '@/enums/page-colors.js';
import { WheelColorType } from '@/enums/wheel-colors.js';
import { buildPageColorConfig, buildWheelColorConfig } from '@/utils/configs.js';
import { fromWireConfig, toWireConfig } from '@/utils/wire-config.js';
import { wireConfigSchema } from '@/validators/wire-config.js';

describe('toWireConfig', () => {
    it('omits everything that equals a default', () => {
        const config = new Config().setId('abc').setNames('A\nB');
        expect(toWireConfig(config)).toEqual({ i: 'abc', n: ['A', 'B'] });
    });

    it('stores only the type for gradient page themes', () => {
        const config = new Config().setId('abc').setNames('A');
        config.pageColorConfig = buildPageColorConfig(PageColorType.GradientDawn, '', '');
        expect(toWireConfig(config).p).toEqual({ t: PageColorType.GradientDawn });
    });

    it('stores the background but not the foreground for a single-color page', () => {
        const config = new Config().setId('abc').setNames('A');
        config.pageColorConfig = buildPageColorConfig(PageColorType.Single, '#ffffff', '#111111');
        expect(toWireConfig(config).p).toEqual({ t: PageColorType.Single, b: '#ffffff' });
    });
});

describe('fromWireConfig', () => {
    it('derives the foreground from a single-color background', () => {
        const config = fromWireConfig({ i: 'abc', n: ['A'], p: { t: PageColorType.Single, b: '#ffffff' } });
        expect(config.pageColorConfig.foregroundColor).toBe(INVERSE_FOREGROUND_COLOR);
    });

    it.each([
        buildWheelColorConfig(WheelColorType.Random, '', [], false),
        buildWheelColorConfig(WheelColorType.Monochromatic, '#4062bf', [], true),
        buildWheelColorConfig(WheelColorType.Analogous, '#4062bf', [], false),
        buildWheelColorConfig(WheelColorType.Triad, '#4062bf', [], false),
        buildWheelColorConfig(WheelColorType.Tetrad, '#4062bf', [], false),
        buildWheelColorConfig(WheelColorType.Custom, '', ['#ff0000', '#00ff00'], false),
    ])('round-trips wheel color config %#', (wheelColorConfig) => {
        const config = new Config().setTitle('T').setDescription('D').setNames('A\nB');
        config.setRandomizeOrder(false).setShowNames(false);
        config.wheelColorConfig = wheelColorConfig;
        expect(fromWireConfig(toWireConfig(config)).serialize()).toEqual(config.serialize());
    });
});

describe('wireConfigSchema', () => {
    it.each([
        ['no names', { i: 'abc', n: [] }],
        ['a non-color background', { i: 'abc', n: ['A'], p: { t: 4, b: 'url(https://example.com/x.png)' } }],
        ['an unknown wheel color type', { i: 'abc', n: ['A'], w: { t: 99 } }],
        ['too many names', { i: 'abc', n: Array.from({ length: MAX_NAMES + 1 }, () => 'A') }],
        ['an over-long name', { i: 'abc', n: ['A'.repeat(MAX_NAME_LENGTH + 1)] }],
    ])('rejects %s', (_label, input) => {
        expect(wireConfigSchema.safeParse(input).success).toBe(false);
    });
});

it('generates ids of CONFIG_ID_LENGTH characters', () => {
    expect(Config.generateId()).toHaveLength(CONFIG_ID_LENGTH);
});
