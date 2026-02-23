import { oxlint, prettier } from '@repo/lint-staged/configs';
import { combineConfigs } from '@repo/lint-staged/utils';

export default combineConfigs(oxlint, prettier);
