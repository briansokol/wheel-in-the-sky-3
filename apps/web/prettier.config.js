import { base, makeReactConfig } from '@repo/prettier/configs';
import { combineConfigs } from '@repo/prettier/utils';

export default combineConfigs(base, makeReactConfig('./src/tailwind.css', './tailwind.config.ts'));
