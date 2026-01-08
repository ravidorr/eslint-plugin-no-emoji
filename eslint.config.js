"use strict";

const eslintPluginPlugin = require("eslint-plugin-eslint-plugin");
const nodePlugin = require("eslint-plugin-n");
const globals = require("globals");

module.exports = [
  // ESLint plugin recommended rules
  eslintPluginPlugin.configs["flat/recommended"],

  // Node.js plugin recommended rules
  nodePlugin.configs["flat/recommended"],

  // Base configuration for all JS files
  {
    files: ["lib/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
        ...globals.jest
      }
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
    }
  }
];
