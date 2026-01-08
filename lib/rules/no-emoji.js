/**
 * @fileoverview Rule to disallow emoji characters in string literals and template literals
 * @author Raanan Avidor
 */

"use strict";

const emojiRegex = require("emoji-regex");

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow emoji characters in string literals and template literals",
      recommended: false,
      url: "https://github.com/ravidorr/eslint-plugin-no-emoji/blob/main/docs/rules/no-emoji.md"
    },
    messages: {
      noEmoji: "Emoji character '{{emoji}}' is not allowed in strings."
    },
    schema: []
  },

  create(context) {
    const regex = emojiRegex();

    /**
     * Check a string value for emoji characters and report any found
     * @param {import('eslint').Rule.Node} node - The AST node
     * @param {string} value - The string value to check
     */
    function checkForEmoji(node, value) {
      /* istanbul ignore if -- defensive check, callers already ensure string type */
      if (typeof value !== "string") {
        return;
      }

      let match;
      // Reset regex lastIndex before each use
      regex.lastIndex = 0;

      while ((match = regex.exec(value)) !== null) {
        context.report({
          node,
          messageId: "noEmoji",
          data: {
            emoji: match[0]
          }
        });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          checkForEmoji(node, node.value);
        }
      },

      TemplateElement(node) {
        checkForEmoji(node, node.value.raw);
      }
    };
  }
};
