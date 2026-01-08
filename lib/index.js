/**
 * @fileoverview ESLint plugin to disallow emoji characters in code
 * @author Raanan Avidor
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import noEmoji from "./rules/no-emoji.js";

// Get __dirname equivalent in ESM
const __dirname = dirname(fileURLToPath(import.meta.url));

// Read name and version from package.json to keep in sync (per ESLint docs recommendation)
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf8")
);

const plugin = {
  meta: {
    name: pkg.name,
    version: pkg.version,
    namespace: "no-emoji"
  },
  rules: {
    "no-emoji": noEmoji
  },
  configs: {}
};

// Add recommended config for legacy eslintrc format
plugin.configs.recommended = {
  plugins: ["no-emoji"],
  rules: {
    "no-emoji/no-emoji": "error"
  }
};

// Add flat config for ESLint 9.x (flat/recommended naming per ESLint docs)
plugin.configs["flat/recommended"] = {
  plugins: {
    "no-emoji": plugin
  },
  rules: {
    "no-emoji/no-emoji": "error"
  }
};

// Aliases for convenience
plugin.configs.flat = plugin.configs["flat/recommended"];
plugin.configs["recommended-flat"] = plugin.configs["flat/recommended"];

export default plugin;
