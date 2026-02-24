import { oxlint, prettier } from './configs.js';
import { combineConfigs } from './utils.js';

export default combineConfigs(oxlint, prettier);
