# no-emoji

Disallow emoji characters in string literals and template literals.

## Rule Details

This rule reports an error when emoji characters are found in string literals or template literals. The error message includes the specific emoji character that was detected.

## Why Use This Rule?

- **Consistency**: Emojis can cause issues in certain environments or terminals that don't support Unicode properly
- **Portability**: They may not render consistently across different platforms, IDEs, or fonts
- **Maintainability**: Emojis can make code harder to search, grep, and maintain
- **Standards Compliance**: Some coding standards or organizations require ASCII-only strings
- **Professionalism**: Keep user-facing strings professional and accessible

## Examples

### Incorrect

```js
// Face emojis
const message = "Great job! [grinning face]";

// Hand gestures
const greeting = "Hello [waving hand]";

// Symbols
const status = "Complete [check mark]";

// In template literals
const template = `Welcome ${name} [party popper]`;

// Multiple emojis
const reaction = "[thumbs up][heart][fire]";
```

### Correct

```js
// Plain text
const message = "Great job!";

// Use descriptive text instead
const greeting = "Hello";

// ASCII alternatives
const status = "Complete [OK]";

// Template literals without emojis
const template = `Welcome ${name}!`;

// Descriptive text
const reaction = "Liked";
```

## Supported Emoji Types

This rule detects all Unicode emoji characters, including:

| Type | Examples |
|------|----------|
| Face emojis | Smileys, emotions, expressions |
| Hand gestures | Thumbs up, waving, pointing |
| Hearts | Red heart, colored hearts |
| Animals | Dogs, cats, birds, etc. |
| Nature | Sun, moon, stars, weather |
| Food | Pizza, coffee, fruits |
| Flags | Country flags (compound emojis) |
| Symbols | Check marks, crosses, arrows |
| Skin tone modifiers | Emojis with skin tone variants |
| ZWJ sequences | Family, profession emojis |
| Keycap emojis | Number and symbol keycaps |

## Options

This rule has no configuration options.

## When Not To Use It

You might want to disable this rule if:

- Your application specifically requires emoji support (e.g., chat applications)
- You're working on internationalization features that include emoji
- Your team has decided emojis are acceptable in certain contexts

To disable for a specific line:

```js
// eslint-disable-next-line no-emoji/no-emoji
const specialMessage = "Party time [party popper]";
```

To disable for an entire file:

```js
/* eslint-disable no-emoji/no-emoji */
```

## Related Rules

- [no-irregular-whitespace](https://eslint.org/docs/rules/no-irregular-whitespace) - Disallow irregular whitespace characters

## Resources

- [Unicode Emoji Technical Standard](https://unicode.org/reports/tr51/)
- [emoji-regex package](https://github.com/mathiasbynens/emoji-regex)
