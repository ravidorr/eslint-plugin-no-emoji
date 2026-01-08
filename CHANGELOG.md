# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.2] - 2026-01-08

### Fixed

- Added missing `@eslint/js` recommended rules to flat config (restores core ESLint rules like `no-undef`, `no-dupe-keys`, etc.)

## [2.0.1] - 2026-01-08

### Fixed

- Corrected minimum Node.js version to 18.18.0 (matches ESLint 9 requirements)

## [2.0.0] - 2026-01-08

### Changed

- **BREAKING**: Package is now ESM-only. Use `import` instead of `require()`
- **BREAKING**: Minimum Node.js version is now 18.18.0 (was 16.0.0)
- Upgraded to ESLint 9 flat config for internal linting
- Upgraded Jest from v29 to v30
- Upgraded eslint-plugin-eslint-plugin from v6 to v7

### Added

- Pre-commit hooks with Husky and lint-staged to enforce code quality
- ESM exports field in package.json

## [1.0.0] - 2026-01-08

### Added

- Initial release
- `no-emoji` rule to disallow emoji characters in string literals and template literals
- Support for ESLint 8.x (legacy config) and ESLint 9.x (flat config)
- Comprehensive detection of all emoji types:
  - Face emojis (smileys, emotions)
  - Hand gestures
  - Hearts and symbols
  - Animals and nature
  - Food and drink
  - Flags (country flags)
  - Emoji with skin tone modifiers
  - ZWJ (Zero Width Joiner) sequences
  - Keycap emojis
- Pre-configured recommended configs for both legacy and flat config formats

[Unreleased]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.2...HEAD
[2.0.2]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ravidorr/eslint-plugin-no-emoji/releases/tag/v1.0.0
