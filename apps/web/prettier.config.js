import { base, makeReactConfig } from '@repo/prettier/configs';
import { combineConfigs } from '@repo/prettier/utils';

export default combineConfigs(base, makeReactConfig('./src/globals.css', './tailwind.config.js'));
