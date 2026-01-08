# Contributing to eslint-plugin-no-emoji

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

When filing a bug report, include:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- ESLint version, Node.js version, and plugin version
- Code sample that demonstrates the issue

### Suggesting Features

Feature suggestions are welcome! Please:
- Check existing issues first
- Provide a clear use case
- Explain why this would be useful to other users

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Add or update tests as needed
5. Ensure all tests pass (`npm test`)
6. Run the linter (`npm run lint`)
7. Commit your changes with a clear message
8. Push to your fork
9. Open a Pull Request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/eslint-plugin-no-emoji.git
cd eslint-plugin-no-emoji

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

## Project Structure

```
eslint-plugin-no-emoji/
  lib/
    rules/
      no-emoji.js       # Rule implementation
    index.js            # Plugin entry point
  tests/
    no-emoji.test.js    # Unit tests
  docs/
    rules/
      no-emoji.md       # Rule documentation
```

## Writing Tests

Tests use Jest and ESLint's RuleTester. When adding tests:

- Add valid cases for code that should pass
- Add invalid cases for code that should fail
- Include the expected error message in invalid cases
- Test edge cases and various emoji types

Example test structure:

```js
ruleTester.run("no-emoji", rule, {
  valid: [
    { code: 'const msg = "Hello";' }
  ],
  invalid: [
    {
      code: 'const msg = "Hello [emoji]";',
      errors: [{ messageId: "noEmoji" }]
    }
  ]
});
```

## Commit Messages

Use clear, descriptive commit messages:

- `feat: add support for X`
- `fix: handle edge case in Y`
- `docs: update README with Z`
- `test: add tests for W`
- `chore: update dependencies`

## Questions?

Feel free to open an issue for any questions about contributing.
