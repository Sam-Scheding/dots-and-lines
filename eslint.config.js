import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Note: `core` is meant to be DOM-free. That is enforced by the TypeScript
// `lib` setting in core/tsconfig.json (no "DOM"), not by ESLint globals.
export default tseslint.config(
  { ignores: ['**/dist', '**/coverage', '.yarn'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022 },
  },
  {
    files: ['packages/react/src/**/*.{ts,tsx}', 'playground/src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    files: ['*.config.{js,ts}', '*/*.config.{js,ts}', '*/*/*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
  eslintConfigPrettier,
);
