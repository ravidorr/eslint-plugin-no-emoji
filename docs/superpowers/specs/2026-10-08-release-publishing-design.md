# Release Publishing Design

## Goal

Publish `eslint-plugin-no-emoji` to npm automatically after an eligible pull request
merges into the repository's default branch. Publishing must be guarded by review,
release metadata, and the project's full release checks.

## Release Policy

- Every release pull request updates `package.json`, `package-lock.json`,
  `CHANGELOG.md`, and `SECURITY.md` for the next package version.
- A patch bump is the default.
- A `release:minor` label requires the next minor version.
- A `release:major` label requires the next major version.
- A pull request cannot carry both release labels.
- A non-owner author requires an approving review from someone other than the author.
  Pull requests created by the repository owner may publish without a review.

## Components

### Release Metadata Validator

`scripts/validate-release-metadata.mjs` will:

1. Read the base version from the pull request's target commit.
2. Derive the required SemVer bump from the release labels.
3. Verify that `package.json` declares exactly that version.
4. Verify that the root package version and the root package entry in
   `package-lock.json` match `package.json`.
5. Require a non-empty `CHANGELOG.md` section for the new version.
6. Reuse the security-policy validator to require the new version as the only
   supported release in `SECURITY.md`.

The validator will expose pure functions for version parsing, label selection,
lockfile validation, changelog validation, and release metadata validation.
Node tests will cover accepted patch, minor, and major releases plus malformed or
mismatched metadata.

### Pull Request Approval Validator

`scripts/check-pull-request-approval.mjs` will retrieve the pull request and its
reviews through the GitHub API. It will use each reviewer's latest submitted state
and accept either an approval from someone other than the non-owner author or a
pull request authored by the repository owner. Missing GitHub context, API failures,
and no qualifying approval will fail safely.

### Pull Request Validation Workflow

`.github/workflows/release-metadata.yml` will run when a pull request is opened,
updated, reopened, labeled, or unlabeled. It will check out history, pass labels and
the base commit to the release metadata validator, and fail the pull request before
merge if its release metadata is invalid.

### Publish Workflow

`.github/workflows/publish.yml` will run after a pull request closes and continue
only when it was merged. It will:

1. Check out the merge commit.
2. Require the approval policy.
3. Validate release metadata against the first parent of the merge commit.
4. Install dependencies with `npm ci`.
5. Run linting, coverage tests, approval-validator tests, security-policy tests, and
   release-metadata tests.
6. Check whether the exact package version already exists on npm.
7. Publish a missing version with `npm publish --provenance --access public`.

The workflow grants `id-token: write` for npm trusted publishing and serializes runs
with a repository-wide publish concurrency group. An existing npm version is treated
as a successful no-op so re-run workflows do not fail.

## Integration

`package.json` will add commands for validating and testing release metadata and
pull request approval. The existing CI workflow will run the new test suites.
`README.md` will document the release contract and npm trusted-publisher setup.

The current release pull request will be prepared as a patch release by setting the
version to `2.0.3`, adding the matching changelog entry, and setting the same version
as the only supported release in `SECURITY.md`.

## Failure Behavior

No publish step runs unless every preceding release guard succeeds. Any validation
failure leaves npm unchanged and reports a focused workflow error that identifies the
invalid release metadata or approval state.
