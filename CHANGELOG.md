# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/ravidorr/eslint-plugin-no-emoji/releases/tag/v1.0.0
