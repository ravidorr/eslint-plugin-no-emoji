/**
 * @fileoverview Tests for no-emoji rule
 * @author Raanan Avidor
 */

"use strict";

const { RuleTester } = require("eslint");
const rule = require("../lib/rules/no-emoji");

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2020
  }
});

ruleTester.run("no-emoji", rule, {
  valid: [
    // Regular strings without emojis
    {
      code: 'const message = "Hello, world!";'
    },
    {
      code: "const message = 'Hello, world!';"
    },
    {
      code: "const message = `Hello, world!`;"
    },

    // Strings with special characters that are NOT emojis
    {
      code: 'const text = "Special chars: @#$%^&*()";'
    },
    {
      code: 'const text = "Unicode: cafe";'
    },
    {
      code: 'const text = "Numbers: 0123456789";'
    },
    {
      code: 'const text = "Punctuation: !?.,:;";'
    },

    // Empty strings
    {
      code: 'const empty = "";'
    },
    {
      code: "const empty = ``;"
    },

    // Template literals with expressions (no emojis)
    {
      code: "const msg = `Hello ${name}!`;"
    },
    {
      code: "const msg = `Value: ${1 + 2}`;"
    },

    // Multiline strings without emojis
    {
      code: "const text = `Line 1\nLine 2\nLine 3`;"
    },

    // Non-string literals
    {
      code: "const num = 42;"
    },
    {
      code: "const bool = true;"
    },
    {
      code: "const nil = null;"
    }
  ],

  invalid: [
    // Simple face emojis
    {
      code: 'const smile = "\u{1F600}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F600}" }
        }
      ]
    },
    {
      code: 'const wink = "\u{1F609}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F609}" }
        }
      ]
    },
    {
      code: 'const cry = "\u{1F622}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F622}" }
        }
      ]
    },

    // Hand gestures
    {
      code: 'const thumbsUp = "\u{1F44D}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F44D}" }
        }
      ]
    },
    {
      code: 'const wave = "\u{1F44B}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F44B}" }
        }
      ]
    },

    // Heart emojis
    {
      code: 'const heart = "\u{2764}\u{FE0F}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{2764}\u{FE0F}" }
        }
      ]
    },

    // Animals
    {
      code: 'const dog = "\u{1F436}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F436}" }
        }
      ]
    },
    {
      code: 'const cat = "\u{1F431}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F431}" }
        }
      ]
    },

    // Food emojis
    {
      code: 'const pizza = "\u{1F355}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F355}" }
        }
      ]
    },
    {
      code: 'const coffee = "\u{2615}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{2615}" }
        }
      ]
    },

    // Weather/Nature
    {
      code: 'const sun = "\u{2600}\u{FE0F}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{2600}\u{FE0F}" }
        }
      ]
    },
    {
      code: 'const fire = "\u{1F525}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F525}" }
        }
      ]
    },

    // Symbols
    {
      code: 'const check = "\u{2705}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{2705}" }
        }
      ]
    },
    {
      code: 'const cross = "\u{274C}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{274C}" }
        }
      ]
    },
    {
      code: 'const warning = "\u{26A0}\u{FE0F}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{26A0}\u{FE0F}" }
        }
      ]
    },

    // Flags (compound emojis)
    {
      code: 'const usa = "\u{1F1FA}\u{1F1F8}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F1FA}\u{1F1F8}" }
        }
      ]
    },

    // Multiple emojis in one string
    {
      code: 'const multiple = "\u{1F600}\u{1F44D}\u{2764}\u{FE0F}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F600}" }
        },
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F44D}" }
        },
        {
          messageId: "noEmoji",
          data: { emoji: "\u{2764}\u{FE0F}" }
        }
      ]
    },

    // Emoji mixed with text
    {
      code: 'const mixed = "Hello \u{1F44B} World!";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F44B}" }
        }
      ]
    },

    // Template literals with emojis
    {
      code: "const template = `Hello \u{1F600}`;",
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F600}" }
        }
      ]
    },
    {
      code: "const template = `\u{1F44D} Great job!`;",
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F44D}" }
        }
      ]
    },

    // Template literals with expressions and emojis
    {
      code: "const msg = `Hello ${name} \u{1F44B}`;",
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F44B}" }
        }
      ]
    },

    // Single quotes with emojis
    {
      code: "const single = '\u{1F600}';",
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F600}" }
        }
      ]
    },

    // Emoji with skin tone modifier
    {
      code: 'const thumbsUpTone = "\u{1F44D}\u{1F3FB}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F44D}\u{1F3FB}" }
        }
      ]
    },

    // ZWJ sequence emoji (family)
    {
      code: 'const family = "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F468}\u{200D}\u{1F469}\u{200D}\u{1F467}" }
        }
      ]
    },

    // Keycap emojis
    {
      code: 'const keycap = "#\u{FE0F}\u{20E3}";',
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "#\u{FE0F}\u{20E3}" }
        }
      ]
    },

    // Multiline template with emoji
    {
      code: "const multiline = `Line 1\n\u{1F600} Line 2\nLine 3`;",
      errors: [
        {
          messageId: "noEmoji",
          data: { emoji: "\u{1F600}" }
        }
      ]
    }
  ]
});

// Additional test to verify the plugin exports
describe("Plugin exports", () => {
  const plugin = require("../lib/index");
  const pkg = require("../package.json");

  test("exports meta information synced with package.json", () => {
    expect(plugin.meta.name).toBe(pkg.name);
    expect(plugin.meta.version).toBe(pkg.version);
    expect(plugin.meta.namespace).toBe("no-emoji");
  });

  test("exports the no-emoji rule", () => {
    expect(plugin.rules["no-emoji"]).toBeDefined();
    expect(plugin.rules["no-emoji"].meta).toBeDefined();
    expect(plugin.rules["no-emoji"].create).toBeDefined();
  });

  test("exports recommended config for legacy format", () => {
    expect(plugin.configs.recommended).toBeDefined();
    expect(plugin.configs.recommended.plugins).toContain("no-emoji");
    expect(plugin.configs.recommended.rules["no-emoji/no-emoji"]).toBe("error");
  });

  test("exports flat/recommended config for ESLint 9.x", () => {
    expect(plugin.configs["flat/recommended"]).toBeDefined();
    expect(plugin.configs["flat/recommended"].plugins["no-emoji"]).toBe(plugin);
    expect(plugin.configs["flat/recommended"].rules["no-emoji/no-emoji"]).toBe("error");
  });

  test("exports flat as alias to flat/recommended", () => {
    expect(plugin.configs.flat).toBe(plugin.configs["flat/recommended"]);
  });

  test("exports recommended-flat as alias to flat/recommended", () => {
    expect(plugin.configs["recommended-flat"]).toBe(plugin.configs["flat/recommended"]);
  });
});
