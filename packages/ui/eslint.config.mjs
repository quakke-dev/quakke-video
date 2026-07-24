import rootConfig from '../../eslint.config.mjs';
import { createConfig, reactConfig } from '../eslint-config/index.mjs';

export default createConfig(rootConfig, reactConfig);
