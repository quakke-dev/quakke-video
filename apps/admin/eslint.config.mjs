import rootConfig from '../../eslint.config.mjs';
import { createConfig, nextConfig } from '../../packages/eslint-config/index.mjs';

export default createConfig(rootConfig, nextConfig);
