module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
    jest: true
  },
  plugins: ["@typescript-eslint"],
  parser: "babel-eslint",
  extends: [
    "eslint:recommended"
  ],
  rules: {
    //js
    "no-console": "off",
    "camelcase": "off",
  },
  overrides: [
    //ts
    {
      plugins: ["@typescript-eslint"],

      files: ["*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        'project': './tsconfig.json'
      },
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
      ],
      /**
       * Typescript Rules
       * https://github.com/bradzacher/eslint-plugin-typescript
       */
      rules: {
        "camelcase": "off",
        "@typescript-eslint/camelcase": "off" //not supported? Will throw error if set to anything else
      }
    }
  ] 
};