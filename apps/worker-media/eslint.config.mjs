import rootConfig from '../../eslint.config.mjs';
import { createConfig, nestConfig } from '../../packages/eslint-config/index.mjs';

export default createConfig(rootConfig, nestConfig);
