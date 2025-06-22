import { base, makeTailwindConfig } from '@repo/prettier/configs';
import { combineConfigs } from '@repo/prettier/utils';

export default combineConfigs(base, makeTailwindConfig('./src/globals.css', './tailwind.config.js'));
