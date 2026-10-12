# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.11] - 2026-10-13

### Changed

- Updated the `actions/checkout` GitHub Action.

## [2.0.10] - 2026-10-13

### Changed

- Updated the `actions/setup-node` GitHub Action.

## [2.0.9] - 2026-10-13

### Changed

- Updated the Codecov GitHub Action.

## [2.0.8] - 2026-10-13

### Changed

- Updated `@babel/core` dependency.

## [2.0.7] - 2026-10-13

### Changed

- Updated transitive `flatted` dependency.

## [2.0.6] - 2026-10-12

### Changed

- Updated transitive `minimatch` dependency.

## [2.0.5] - 2026-10-12

### Changed

- Updated transitive `picomatch` dependencies.

## [2.0.4] - 2026-10-11

### Changed

- Reorganize README badge rows.

## [2.0.3] - 2026-10-08

### Added

- Added release metadata validation and guarded npm trusted publishing for approved pull requests.

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

[Unreleased]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.11...HEAD
[2.0.11]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.10...v2.0.11
[2.0.10]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.9...v2.0.10
[2.0.9]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.8...v2.0.9
[2.0.8]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.7...v2.0.8
[2.0.7]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.6...v2.0.7
[2.0.6]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.5...v2.0.6
[2.0.5]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.4...v2.0.5
[2.0.4]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.3...v2.0.4
[2.0.3]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.2...v2.0.3
[2.0.2]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.1...v2.0.2
[2.0.1]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/ravidorr/eslint-plugin-no-emoji/releases/tag/v1.0.0
