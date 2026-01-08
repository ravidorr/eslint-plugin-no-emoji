import js from "@eslint/js";
import eslintPluginPlugin from "eslint-plugin-eslint-plugin";
import nodePlugin from "eslint-plugin-n";
import globals from "globals";

export default [
  // ESLint core recommended rules
  js.configs.recommended,

  // ESLint plugin recommended rules (v7 uses flat config by default)
  eslintPluginPlugin.configs.recommended,

  // Node.js plugin recommended rules
  nodePlugin.configs["flat/recommended"],

  // Base configuration for all JS files
  {
    files: ["lib/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
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
      // Allow ESM syntax
      "n/no-unsupported-features/es-syntax": "off"
    }
  }
];
