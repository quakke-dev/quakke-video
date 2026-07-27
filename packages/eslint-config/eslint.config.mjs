import rootConfig from '../../eslint.config.mjs';
import { createConfig, nodeConfig } from './index.mjs';

export default createConfig(rootConfig, nodeConfig);
