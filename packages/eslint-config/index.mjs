import js from '@eslint/js';
import next from '@next/eslint-plugin-next';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import playwright from 'eslint-plugin-playwright';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const typescriptFiles = ['**/*.{ts,tsx,cts,mts}'];
const javascriptFiles = ['**/*.{js,jsx,cjs,mjs}'];
const testFiles = [
  '**/*.spec.{js,jsx,ts,tsx}',
  '**/*.test.{js,jsx,ts,tsx}',
  '**/test-setup.{js,jsx,ts,tsx}',
];

export const ignores = globalIgnores(
  [
    '**/.next/**',
    '**/.nx/**',
    '**/coverage/**',
    '**/dist/**',
    '**/next-env.d.ts',
    '**/out-tsc/**',
    '**/storybook-static/**',
    '**/test-output/**',
    '**/vitest.config.*.timestamp*',
  ],
  'quakke/ignores',
);

export const baseConfig = defineConfig(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    name: 'quakke/typescript',
    files: typescriptFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
      reportUnusedInlineConfigs: 'error',
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          fixStyle: 'inline-type-imports',
          prefer: 'type-imports',
        },
      ],
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-deprecated': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/require-await': 'warn',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowBoolean: true,
          allowNumber: true,
          allowNullish: false,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    ...tseslint.configs.disableTypeChecked,
    name: 'quakke/javascript',
    files: javascriptFiles,
  },
);

export const reactConfig = defineConfig({
  name: 'quakke/react',
  files: ['**/*.{jsx,tsx}'],
  extends: [
    react.configs.flat.recommended,
    react.configs.flat['jsx-runtime'],
    reactHooks.configs.flat.recommended,
    jsxA11y.flatConfigs.recommended,
  ],
  languageOptions: {
    globals: globals.browser,
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/no-autofocus': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
  },
});

export const nextConfig = defineConfig(reactConfig, next.configs['core-web-vitals'], {
  name: 'quakke/next',
  files: [...typescriptFiles, ...javascriptFiles],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
});

export const nodeConfig = defineConfig({
  name: 'quakke/node',
  files: [...typescriptFiles, ...javascriptFiles],
  languageOptions: {
    globals: globals.node,
  },
});

export const nestConfig = defineConfig(nodeConfig, {
  name: 'quakke/nest',
  files: typescriptFiles,
  rules: {
    '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
  },
});

export const testConfig = defineConfig({
  name: 'quakke/tests',
  files: testFiles,
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.jest,
      ...globals.node,
      ...globals.vitest,
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/require-await': 'off',
  },
});

export const playwrightConfig = defineConfig({
  name: 'quakke/playwright',
  files: ['**/*.spec.{js,jsx,ts,tsx}'],
  extends: [playwright.configs['flat/recommended']],
});

export const e2eSupportConfig = defineConfig({
  name: 'quakke/e2e-support',
  files: ['**/src/support/**/*.{js,ts}'],
  rules: {
    'no-console': 'off',
  },
});

export const configFilesConfig = defineConfig({
  ...tseslint.configs.disableTypeChecked,
  name: 'quakke/config-files',
  files: ['**/*.{config,preset}.{js,cjs,mjs,ts,cts,mts}'],
  languageOptions: {
    globals: globals.node,
    parserOptions: {
      projectService: false,
    },
  },
  rules: {
    ...tseslint.configs.disableTypeChecked.rules,
    '@typescript-eslint/no-require-imports': 'off',
    'no-console': 'off',
  },
});

export const createConfig = (...configs) =>
  defineConfig(...configs, {
    name: 'quakke/prettier',
    ...eslintConfigPrettier,
  });
