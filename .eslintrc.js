"use strict";

module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
    jest: true
  },
  extends: [
    "eslint:recommended",
    "plugin:eslint-plugin/recommended",
    "plugin:n/recommended"
  ],
  plugins: ["eslint-plugin", "n"],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "no-console": "warn",
    "prefer-const": "error",
    "eqeqeq": ["error", "always"],
    "curly": ["error", "all"],
    "semi": ["error", "always"],
    "quotes": ["error", "double", { avoidEscape: true }],
    // Allow requires in CommonJS
    "n/no-unsupported-features/es-syntax": "off"
  },
  overrides: [
    {
      files: ["tests/**/*.js"],
      env: {
        jest: true
      }
    }
  ]
};
