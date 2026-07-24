import rootConfig from '../../eslint.config.mjs';
import { createConfig, e2eSupportConfig, nodeConfig } from '../../packages/eslint-config/index.mjs';

export default createConfig(rootConfig, nodeConfig, e2eSupportConfig);
