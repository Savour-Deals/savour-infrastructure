module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  rules: {
    //js
    "no-console": "off",
    "camelcase": "warn",
  },
  overrides: [
    //ts
    {
      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        'project': './tsconfig.json'
      },
      plugins: ["@typescript-eslint"],
      /**
       * Typescript Rules
       * https://github.com/bradzacher/eslint-plugin-typescript
       */
      rules: {
        '@typescript-eslint/camelcase': "off"
      }
    }
  ] 
};