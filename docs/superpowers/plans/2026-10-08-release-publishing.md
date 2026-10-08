# Release Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish an approved, correctly versioned merged pull request to npm through trusted publishing.

**Architecture:** Pure Node validators enforce release metadata and approval policy locally and in pull request CI. A publish workflow runs only after a merged pull request, revalidates the merged commit, and invokes npm with provenance after every release check succeeds.

**Tech Stack:** Node.js ESM, `node:test`, GitHub Actions, npm trusted publishing.

## Global Constraints

- Support Node.js 18.18.0 and newer in the package; use Node.js 24 in the publish workflow.
- Do not add runtime dependencies.
- Keep patch releases as the default. `release:minor` and `release:major` select larger SemVer bumps and cannot coexist.
- The release version must match in `package.json`, `package-lock.json`, `CHANGELOG.md`, and `SECURITY.md`.
- Publishing requires a non-author approval unless the pull request author is the repository owner.
- Never publish an already existing npm version.

---

## File Structure

- Create `scripts/validate-release-metadata.mjs`: pure SemVer, label, lockfile, changelog, and release-metadata validation plus a git-backed CLI.
- Create `scripts/validate-release-metadata.test.mjs`: behavior tests for every release metadata rule and workflow configuration.
- Create `scripts/check-pull-request-approval.mjs`: GitHub API approval policy and CLI.
- Create `scripts/check-pull-request-approval.test.mjs`: approval policy behavior tests.
- Create `.github/workflows/release-metadata.yml`: pull request metadata validation.
- Create `.github/workflows/publish.yml`: guarded trusted publishing after a merged pull request.
- Modify `package.json`: expose validation and test commands.
- Modify `.github/workflows/ci.yml`: execute both Node test suites in pull request and branch CI.
- Modify `README.md`: document the required release artifacts, labels, and trusted publisher prerequisite.
- Modify `package-lock.json`, `CHANGELOG.md`, and `SECURITY.md`: prepare this pull request as version `2.0.3`.

## Task 1: Add the Release Metadata Validator

**Files:**
- Create: `scripts/validate-release-metadata.mjs`
- Create: `scripts/validate-release-metadata.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `readStablePackageVersion()` and `validateSecurityPolicyVersion()` from `scripts/validate-security-policy-version.mjs`.
- Produces: `parseSemVerTriplet(version)`, `bumpSemVer(version, releaseType)`, `releaseTypeFromLabels(labels)`, `readLockfilePackageVersion(contents)`, `validateChangelogForVersion(changelog, version)`, `validateReleaseMetadata(input)`, and `validateReleaseMetadataFromGit(input)`.

- [ ] **Step 1: Write failing release metadata tests**

Create a Node test file that imports the six exported validator functions. Use test fixtures with base version `2.0.2`, exact JSON strings, a supported-version table that contains only the test version, and a changelog section with a bullet.

```js
test("accepts the exact default patch release", () => {
  assert.deepEqual(
    validateReleaseMetadata({
      basePackageJson: '{"version":"2.0.2"}',
      headPackageJson: '{"version":"2.0.3"}',
      headLockJson: lockFor("2.0.3"),
      headChangelog: changelogFor("2.0.3"),
      headSecurityPolicy: policyFor("2.0.3"),
      labels: [],
    }),
    { valid: true, version: "2.0.3", releaseType: "patch" },
  );
});

test("requires exactly the bump selected by release labels", () => {
  assert.equal(bumpSemVer("2.0.2", "minor"), "2.1.0");
  assert.equal(bumpSemVer("2.0.2", "major"), "3.0.0");
  assert.match(
    releaseTypeFromLabels(["release:minor", "release:major"]).error,
    /only one release label/i,
  );
});

test("rejects inconsistent lockfiles, changelogs, and security policies", () => {
  const metadata = {
    basePackageJson: '{"version":"2.0.2"}',
    headPackageJson: '{"version":"2.0.3"}',
    headLockJson: lockFor("2.0.2"),
    headChangelog: changelogFor("2.0.3"),
    headSecurityPolicy: policyFor("2.0.3"),
    labels: [],
  };

  assert.match(validateReleaseMetadata(metadata).error, /package-lock\.json/);
  assert.match(
    validateReleaseMetadata({ ...metadata, headLockJson: lockFor("2.0.3"), headChangelog: "" })
      .error,
    /CHANGELOG\.md/,
  );
  assert.match(
    validateReleaseMetadata({ ...metadata, headLockJson: lockFor("2.0.3"), headSecurityPolicy: policyFor("2.0.2") })
      .error,
    /SECURITY\.md/,
  );
});
```

- [ ] **Step 2: Run the new test file and verify it fails**

Run: `node --test scripts/validate-release-metadata.test.mjs`

Expected: failure because `scripts/validate-release-metadata.mjs` does not exist.

- [ ] **Step 3: Implement the pure release metadata functions**

Create the validator with strict `major.minor.patch` parsing, exact expected version calculation, and focused errors. The top-level validator must reject malformed base or head versions, conflicting labels, an unexpected version, mismatched root lockfile versions, a missing or empty versioned changelog section, and an invalid security policy.

```js
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import {
  readStablePackageVersion,
  validateSecurityPolicyVersion,
} from "./validate-security-policy-version.mjs";

export const RELEASE_LABEL_MINOR = "release:minor";
export const RELEASE_LABEL_MAJOR = "release:major";
const STABLE_TRIPLET = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function parseSemVerTriplet(version) {
  const match = STABLE_TRIPLET.exec(version);
  return match
    ? { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
    : null;
}

export function bumpSemVer(version, releaseType) {
  const parsed = parseSemVerTriplet(version);
  if (!parsed) return null;
  switch (releaseType) {
    case "patch":
      return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
    case "minor":
      return `${parsed.major}.${parsed.minor + 1}.0`;
    case "major":
      return `${parsed.major + 1}.0.0`;
    default:
      return null;
  }
}

export function releaseTypeFromLabels(labels) {
  const normalized = labels.map((label) => label.trim()).filter(Boolean);
  const hasMinor = normalized.includes(RELEASE_LABEL_MINOR);
  const hasMajor = normalized.includes(RELEASE_LABEL_MAJOR);

  if (hasMinor && hasMajor) {
    return { error: `Use only one release label: ${RELEASE_LABEL_MINOR} or ${RELEASE_LABEL_MAJOR}.` };
  }

  return { releaseType: hasMajor ? "major" : hasMinor ? "minor" : "patch" };
}

export function readLockfilePackageVersion(contents) {
  try {
    const lockfile = JSON.parse(contents);
    return lockfile.version === lockfile.packages?.[""]?.version ? lockfile.version : null;
  } catch {
    return null;
  }
}

export function validateChangelogForVersion(changelog, version) {
  const escaped = version.replaceAll(".", "\\.");
  const section = new RegExp(
    `^## \\[${escaped}\\][^\\n]*\\n(?<body>[\\s\\S]*?)(?=^## \\[|\\z)`,
    "m",
  ).exec(changelog);

  if (!section) {
    return { valid: false, error: `CHANGELOG.md is missing a section for version ${version}.` };
  }

  return /^[ \t]*[-*][ \t]+.+$/m.test(section.groups.body)
    ? { valid: true }
    : { valid: false, error: `CHANGELOG.md section for ${version} must include at least one bullet entry.` };
}

export function validateReleaseMetadata({
  basePackageJson,
  headPackageJson,
  headLockJson,
  headChangelog,
  headSecurityPolicy,
  labels = [],
}) {
  const baseVersion = readStablePackageVersion(basePackageJson);
  const headVersion = readStablePackageVersion(headPackageJson);
  if (!baseVersion || !headVersion) {
    return { valid: false, error: "package.json must contain a stable SemVer version." };
  }

  const labelResult = releaseTypeFromLabels(labels);
  if ("error" in labelResult) return { valid: false, error: labelResult.error };

  const expectedVersion = bumpSemVer(baseVersion, labelResult.releaseType);
  if (headVersion !== expectedVersion) {
    return {
      valid: false,
      error: `Expected version ${expectedVersion} for a ${labelResult.releaseType} release from ${baseVersion}, but package.json declares ${headVersion}.`,
    };
  }

  if (readLockfilePackageVersion(headLockJson) !== headVersion) {
    return { valid: false, error: "package-lock.json must declare the same version as package.json." };
  }

  const changelogResult = validateChangelogForVersion(headChangelog, headVersion);
  if (!changelogResult.valid) return changelogResult;

  const policyResult = validateSecurityPolicyVersion(headPackageJson, headSecurityPolicy);
  return policyResult.valid
    ? { valid: true, version: headVersion, releaseType: labelResult.releaseType }
    : policyResult;
}
```

Add the git-backed input adapter:

```js
export function validateReleaseMetadataFromGit({ baseRef, labels = [] }) {
  try {
    return validateReleaseMetadata({
      basePackageJson: execFileSync("git", ["show", `${baseRef}:package.json`], { encoding: "utf8" }),
      headPackageJson: readFileSync("package.json", "utf8"),
      headLockJson: readFileSync("package-lock.json", "utf8"),
      headChangelog: readFileSync("CHANGELOG.md", "utf8"),
      headSecurityPolicy: readFileSync("SECURITY.md", "utf8"),
      labels,
    });
  } catch (error) {
    return { valid: false, error: `Unable to read release metadata files: ${error.message}` };
  }
}
```

Parse `--base-ref` and `--labels` in the executable path, write a success message
to stdout, and write a focused validation error to stderr with exit status `1` on
failure.

- [ ] **Step 4: Run the release metadata test file and verify it passes**

Run: `node --test scripts/validate-release-metadata.test.mjs`

Expected: all test cases pass, including patch, minor, major, invalid labels, and
invalid metadata.

- [ ] **Step 5: Add package commands and commit**

Add these scripts to `package.json`:

```json
"validate:release-metadata": "node scripts/validate-release-metadata.mjs",
"test:release-metadata": "node --test scripts/validate-release-metadata.test.mjs"
```

Run: `npm run test:release-metadata`

Commit:

```bash
git add package.json scripts/validate-release-metadata.mjs scripts/validate-release-metadata.test.mjs
git commit -m "feat: validate release metadata"
```

## Task 2: Add the Pull Request Approval Validator

**Files:**
- Create: `scripts/check-pull-request-approval.mjs`
- Create: `scripts/check-pull-request-approval.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `hasValidApproval({ reviews, authorLogin, repositoryOwnerLogin })` and `checkPullRequestApproval({ apiBase, repository, pullNumber, token })`.
- Consumed by: the publish workflow and `test:pull-request-approval`.

- [ ] **Step 1: Write failing approval tests**

```js
test("accepts a non-author approving review", () => {
  assert.equal(
    hasValidApproval({
      reviews: [{ state: "APPROVED", user: { login: "maintainer" } }],
      authorLogin: "contributor",
      repositoryOwnerLogin: "owner",
    }),
    true,
  );
});

test("requires an approval for a non-owner author", () => {
  assert.equal(
    hasValidApproval({
      reviews: [{ state: "APPROVED", user: { login: "contributor" } }],
      authorLogin: "contributor",
      repositoryOwnerLogin: "owner",
    }),
    false,
  );
});

test("uses each reviewer's latest state", () => {
  assert.equal(
    hasValidApproval({
      reviews: [
        { state: "APPROVED", user: { login: "maintainer" } },
        { state: "CHANGES_REQUESTED", user: { login: "maintainer" } },
      ],
      authorLogin: "contributor",
      repositoryOwnerLogin: "owner",
    }),
    false,
  );
});
```

Include a test that permits an author whose login equals the repository owner and
tests that pending or anonymous reviews do not count.

- [ ] **Step 2: Verify the test fails**

Run: `node --test scripts/check-pull-request-approval.test.mjs`

Expected: failure because the approval validator does not exist.

- [ ] **Step 3: Implement approval selection and GitHub API access**

```js
export function hasValidApproval({ reviews, authorLogin, repositoryOwnerLogin }) {
  if (authorLogin?.toLowerCase() === repositoryOwnerLogin?.toLowerCase()) {
    return true;
  }

  const latestReviewByUser = new Map();
  for (const review of reviews) {
    if (review.user?.login && review.state !== "PENDING") {
      latestReviewByUser.set(review.user.login, review.state);
    }
  }

  return [...latestReviewByUser.entries()].some(
    ([login, state]) => state === "APPROVED" && login !== authorLogin,
  );
}
```

Use `fetch` with `Authorization: Bearer ${token}` to retrieve
`/pulls/${pullNumber}` and `/pulls/${pullNumber}/reviews`. Reject a missing token,
repository, pull number, malformed owner, non-success API response, and no
qualifying approval. The CLI reads `GITHUB_API_URL`, `GITHUB_REPOSITORY`,
`PULL_NUMBER`, and `GITHUB_TOKEN`; it exits `1` unless the policy passes.

- [ ] **Step 4: Verify all approval tests pass**

Run: `node --test scripts/check-pull-request-approval.test.mjs`

Expected: all approval and rejection cases pass.

- [ ] **Step 5: Add the script and commit**

Add:

```json
"test:pull-request-approval": "node --test scripts/check-pull-request-approval.test.mjs"
```

Run: `npm run test:pull-request-approval`

Commit:

```bash
git add package.json scripts/check-pull-request-approval.mjs scripts/check-pull-request-approval.test.mjs
git commit -m "feat: require release approval"
```

## Task 3: Add Release and Publish Workflows

**Files:**
- Create: `.github/workflows/release-metadata.yml`
- Create: `.github/workflows/publish.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `scripts/validate-release-metadata.test.mjs`

**Interfaces:**
- Consumes: `validate:release-metadata`, `test:release-metadata`, and `test:pull-request-approval` package commands.
- Produces: a metadata status check on every PR and a serialized npm publish after eligible merges.

- [ ] **Step 1: Add failing static workflow assertions**

Add tests that read both workflow files and assert that:

```js
assert.match(publishWorkflow, /pull_request:\s*\n\s*types: \[closed\]/);
assert.match(publishWorkflow, /github\.event\.pull_request\.merged == true/);
assert.match(publishWorkflow, /id-token: write/);
assert.match(publishWorkflow, /npm publish --provenance --access public/);
assert.match(publishWorkflow, /npm view "eslint-plugin-no-emoji@\$\{VERSION\}"/);
assert.match(releaseWorkflow, /types: \[opened, synchronize, reopened, labeled, unlabeled\]/);
assert.match(releaseWorkflow, /validate:release-metadata/);
```

- [ ] **Step 2: Verify workflow assertions fail**

Run: `npm run test:release-metadata`

Expected: failure because neither workflow exists.

- [ ] **Step 3: Implement the pull request metadata workflow**

Create `.github/workflows/release-metadata.yml` with checkout history, Node 22,
the pull request labels, and the pull request base SHA:

```yaml
name: Release Metadata
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]
permissions:
  contents: read
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v5
        with:
          node-version: 22
      - run: |
          node scripts/validate-release-metadata.mjs \
            --base-ref "${{ github.event.pull_request.base.sha }}" \
            --labels "${{ join(github.event.pull_request.labels.*.name, ',') }}"
```

- [ ] **Step 4: Implement the merged pull request publish workflow**

Create `.github/workflows/publish.yml` with a `pull_request` closed trigger,
`if: github.event.pull_request.merged == true`, read permissions plus
`pull-requests: read` and `id-token: write`, and a `npm-publish` concurrency group.
Check out `${{ github.event.pull_request.merge_commit_sha }}` with full history.
Run the approval validator using the pull number and GitHub token, derive the base
commit as `git rev-parse "${MERGE_COMMIT_SHA}^"`, validate release metadata, run
`npm ci`, and run:

```sh
npm run lint
npm run test:coverage
npm run test:pull-request-approval
npm run test:security-policy
npm run test:release-metadata
```

Publish only when npm does not already report the version:

```sh
VERSION="$(node -p "require('./package.json').version")"
if npm view "eslint-plugin-no-emoji@${VERSION}" version >/dev/null 2>&1; then
  echo "eslint-plugin-no-emoji@${VERSION} is already published; skipping."
  exit 0
fi
npm publish --provenance --access public
```

- [ ] **Step 5: Extend CI and verify workflows**

Add `npm run test:security-policy`, `npm run test:release-metadata`, and
`npm run test:pull-request-approval` after the coverage test in the Node matrix
job. Run:

```bash
npm run test:release-metadata
git diff --check
```

Expected: workflow assertion tests pass and the diff has no whitespace errors.

- [ ] **Step 6: Commit workflows**

```bash
git add .github/workflows/ci.yml .github/workflows/release-metadata.yml .github/workflows/publish.yml scripts/validate-release-metadata.test.mjs
git commit -m "ci: publish approved releases to npm"
```

## Task 4: Prepare This Release and Document the Contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`
- Modify: `SECURITY.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the validator and workflow contract from Tasks 1 through 3.
- Produces: valid patch release metadata for `2.0.3`.

- [ ] **Step 1: Update versioned release artifacts**

Set the root version and `packages[""].version` to `2.0.3`. Replace the supported
security version row with `2.0.3`. Add this entry above `2.0.2`:

```md
## [2.0.3] - 2026-10-08

### Added

- Added guarded npm trusted publishing for approved pull requests.
```

Update the `[Unreleased]` compare link to `v2.0.3...HEAD` and add a `[2.0.3]`
compare link from `v2.0.2`.

- [ ] **Step 2: Document release requirements**

Append a `## Releasing` section to `README.md`:

```md
Pull requests must include the next version, a `CHANGELOG.md` entry, and an updated
`SECURITY.md` supported version. Patch releases are the default; add the
`release:minor` or `release:major` label when needed.

After an approved pull request merges, GitHub Actions publishes to npm. Configure
npm trusted publishing once for this repository before the first release.
```

- [ ] **Step 3: Run the full release check suite**

Run:

```bash
npm run lint
npm run test:coverage
npm run test:pull-request-approval
npm run test:security-policy
npm run test:release-metadata
node scripts/validate-release-metadata.mjs --base-ref origin/main
```

Expected: every command exits successfully and the last command reports
`Release metadata is valid for 2.0.3 (patch).`

- [ ] **Step 4: Inspect the final diff and commit**

Run:

```bash
git diff --check origin/main...HEAD
git status --short
```

Commit:

```bash
git add CHANGELOG.md README.md SECURITY.md package.json package-lock.json
git commit -m "chore: prepare version 2.0.3"
```

## Plan Self-Review

- Spec coverage: Task 1 enforces version, lockfile, changelog, and security policy;
  Task 2 enforces approval; Task 3 implements pull request and publish workflows;
  Task 4 documents the contract and makes this pull request eligible to publish.
- Placeholder scan: no unfinished implementation steps or undefined function names.
- Type consistency: Task 1 exports the commands and validation interface used by Tasks
  3 and 4; Task 2 exports the approval interface invoked by Task 3.
