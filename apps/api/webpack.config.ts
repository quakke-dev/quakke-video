import { NxAppWebpackPlugin } from '@nx/webpack/app-plugin';
import { join } from 'node:path';
import type { Configuration } from 'webpack';

const config: Configuration = {
  resolve: {
    alias: {
      '@fastify/static': false,
      '@fastify/view': false,
      'pg-native': false,
    },
  },
  ignoreWarnings: [
    {
      module: /node_modules[\\/]ret[\\/]dist[\\/]/,
      message: /Failed to parse source map/,
    },
  ],
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'swc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
};

export default config;
