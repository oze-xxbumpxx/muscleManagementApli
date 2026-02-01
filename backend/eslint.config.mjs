import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      // セミコロン必須
      semi: ['error', 'always'],

      // any 禁止（Google Style Guide準拠）
      '@typescript-eslint/no-explicit-any': 'error',

      // 未使用変数はエラー
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // console.log は警告（本番では削除推奨）
      'no-console': 'warn',
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '**/*.js',
      '**/*.cjs',
      'src/migrations/**',
      'src/config/sequelize.cjs',
    ],
  }
);
