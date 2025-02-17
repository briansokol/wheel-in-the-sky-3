import { eslint, prettier } from './configs.js';
import { combineConfigs } from './utils.js';

export default combineConfigs(eslint, prettier);
