// eslint.config.js
import antfu from '@antfu/eslint-config';

export default antfu({ vue: true, typescript: true }, {
  rules: {
    'no-console': [
      'error',
      {
        allow: [
          'info',
          'warn',
          'error',
        ],
      },
    ],
    'style/brace-style': [
      'error',
      '1tbs',
      {
        allowSingleLine: true,
      },
    ],
    'style/semi': [
      'error',
      'always',
    ],
    'unused-imports/no-unused-vars': [
      'error',
      {
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'ts/no-unused-vars': [
      'error',
      {
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
  },
});
