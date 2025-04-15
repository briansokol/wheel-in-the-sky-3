import { eslint, prettier } from '@repo/lint-staged/configs';
import { combineConfigs } from '@repo/lint-staged/utils';

export default combineConfigs(eslint, prettier);
