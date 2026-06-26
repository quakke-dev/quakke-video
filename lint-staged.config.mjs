export default {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md,mdx,yml,yaml,css,scss}': [
    'prettier --write',
  ],
};
