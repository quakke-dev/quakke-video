import rootConfig from '../../eslint.config.mjs';
import { createConfig, playwrightConfig } from '../../packages/eslint-config/index.mjs';

export default createConfig(rootConfig, playwrightConfig);
