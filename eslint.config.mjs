import nx from '@nx/eslint-plugin';
import { defineConfig } from 'eslint/config';
import {
  baseConfig,
  configFilesConfig,
  ignores,
  testConfig,
} from './packages/eslint-config/index.mjs';

export default defineConfig(
  ignores,
  ...nx.configs['flat/base'],
  baseConfig,
  configFilesConfig,
  testConfig,
  {
    name: 'quakke/module-boundaries',
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$', '^@quakke/eslint-config$'],
          depConstraints: [
            {
              sourceTag: 'scope:web',
              onlyDependOnLibsWithTags: ['scope:web', 'scope:shared'],
            },
            {
              sourceTag: 'scope:studio',
              onlyDependOnLibsWithTags: ['scope:studio', 'scope:shared'],
            },
            {
              sourceTag: 'scope:admin',
              onlyDependOnLibsWithTags: ['scope:admin', 'scope:shared'],
            },
            {
              sourceTag: 'scope:api',
              onlyDependOnLibsWithTags: ['scope:api', 'scope:shared'],
            },
            {
              sourceTag: 'scope:worker-media',
              onlyDependOnLibsWithTags: ['scope:worker-media', 'scope:shared'],
            },
            {
              sourceTag: 'scope:worker-notifications',
              onlyDependOnLibsWithTags: ['scope:worker-notifications', 'scope:shared'],
            },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:api-client',
                'type:config',
                'type:contracts',
                'type:testing',
                'type:ui',
              ],
            },
            {
              sourceTag: 'type:api-client',
              onlyDependOnLibsWithTags: ['type:contracts', 'type:config', 'type:testing'],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:config', 'type:testing'],
            },
            {
              sourceTag: 'type:contracts',
              onlyDependOnLibsWithTags: ['type:config', 'type:testing'],
            },
            {
              sourceTag: 'type:config',
              onlyDependOnLibsWithTags: ['type:testing'],
            },
            {
              sourceTag: 'type:testing',
              onlyDependOnLibsWithTags: ['type:contracts', 'type:config', 'type:ui'],
            },
          ],
        },
      ],
    },
  },
);
