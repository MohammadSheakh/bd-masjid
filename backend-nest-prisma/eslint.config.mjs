// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'eslint.config.mjs',
      'dist/**',
      'src/common/base/**',
      'src/common/decorators/use-file-upload-pipeline.decorator.ts',
      'src/common/filters/mongoose-exception.filter.ts',
      'src/common/interceptors/file-upload-processing.interceptor.ts',
      'src/common/pipes/file-upload-validation.pipe.ts',
      'src/core/database/mongo/**',
      'src/core/queue/**',
      'src/features/attachments/**',
      'src/features/chatting/**',
      'src/features/chatting.module/**',
      'src/features/notification/**',
      'src/features/notification.module/**',
      'libs/queue/src/processors/**',
      'src/features/authentication/auth/strategies/**',
      'src/features/subscription.module/**',
      'src/features/payment.module/**',
      'src/features/socket.gateway/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'no-empty': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      "prettier/prettier": ["warn", { endOfLine: "auto" }],
    },
  },
);
