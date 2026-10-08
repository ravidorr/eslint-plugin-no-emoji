import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  RELEASE_LABEL_MAJOR,
  RELEASE_LABEL_MINOR,
  bumpSemVer,
  readLockfilePackageVersion,
  releaseTypeFromLabels,
  validateChangelogForVersion,
  validateReleaseMetadata,
  validateReleaseMetadataFromGit,
} from "./validate-release-metadata.mjs";

const basePackageJson = '{"version":"2.0.2"}';
const supportedStatus = String.fromCodePoint(0x2713);
const releaseMetadataScript = fileURLToPath(
  new URL("./validate-release-metadata.mjs", import.meta.url),
);

const policyFor = (version) => `## Supported Versions

| Version | Supported |
| ------- | --------- |
| ${version} | ${supportedStatus} |
| Earlier releases | ✘ |
`;

const lockFor = (version) =>
  JSON.stringify({
    name: "eslint-plugin-no-emoji",
    version,
    lockfileVersion: 3,
    packages: {
      "": {
        name: "eslint-plugin-no-emoji",
        version,
      },
    },
  });

const changelogFor = (version, bullet = "- Example change") => `# Changelog

## [${version}] - 2026-10-08

${bullet}

## [2.0.2] - 2026-01-08
`;

function runGit(cwd, args) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

function createReleaseMetadataFixture() {
  const directory = mkdtempSync(join(tmpdir(), "release-metadata-"));

  runGit(directory, ["init", "--initial-branch=main"]);
  runGit(directory, ["config", "user.email", "test@example.com"]);
  runGit(directory, ["config", "user.name", "Test User"]);
  writeFileSync(join(directory, "package.json"), basePackageJson);
  runGit(directory, ["add", "package.json"]);
  runGit(directory, ["commit", "-m", "base release"]);
  writeFileSync(join(directory, "package.json"), '{"version":"2.0.3"}');
  writeFileSync(join(directory, "package-lock.json"), lockFor("2.0.3"));
  writeFileSync(join(directory, "CHANGELOG.md"), changelogFor("2.0.3"));
  writeFileSync(join(directory, "SECURITY.md"), policyFor("2.0.3"));

  return directory;
}

test("defaults to a patch release without labels", () => {
  assert.deepEqual(releaseTypeFromLabels([]), { releaseType: "patch" });
});

test("selects minor and major releases from labels", () => {
  assert.deepEqual(releaseTypeFromLabels([RELEASE_LABEL_MINOR]), { releaseType: "minor" });
  assert.deepEqual(releaseTypeFromLabels([RELEASE_LABEL_MAJOR]), { releaseType: "major" });
});

test("rejects conflicting release labels", () => {
  assert.match(
    releaseTypeFromLabels([RELEASE_LABEL_MINOR, RELEASE_LABEL_MAJOR]).error,
    /only one release label/i,
  );
});

test("calculates exact SemVer release versions", () => {
  assert.equal(bumpSemVer("2.0.2", "patch"), "2.0.3");
  assert.equal(bumpSemVer("2.0.2", "minor"), "2.1.0");
  assert.equal(bumpSemVer("2.0.2", "major"), "3.0.0");
});

test("accepts a valid patch release", () => {
  assert.deepEqual(
    validateReleaseMetadata({
      basePackageJson,
      headPackageJson: '{"version":"2.0.3"}',
      headLockJson: lockFor("2.0.3"),
      headChangelog: changelogFor("2.0.3"),
      headSecurityPolicy: policyFor("2.0.3"),
      labels: [],
    }),
    { valid: true, version: "2.0.3", releaseType: "patch" },
  );
});

test("accepts valid labeled minor and major releases", () => {
  assert.equal(
    validateReleaseMetadata({
      basePackageJson,
      headPackageJson: '{"version":"2.1.0"}',
      headLockJson: lockFor("2.1.0"),
      headChangelog: changelogFor("2.1.0"),
      headSecurityPolicy: policyFor("2.1.0"),
      labels: [RELEASE_LABEL_MINOR],
    }).valid,
    true,
  );
  assert.equal(
    validateReleaseMetadata({
      basePackageJson,
      headPackageJson: '{"version":"3.0.0"}',
      headLockJson: lockFor("3.0.0"),
      headChangelog: changelogFor("3.0.0"),
      headSecurityPolicy: policyFor("3.0.0"),
      labels: [RELEASE_LABEL_MAJOR],
    }).valid,
    true,
  );
});

test("rejects a version that does not match the required bump", () => {
  assert.match(
    validateReleaseMetadata({
      basePackageJson,
      headPackageJson: '{"version":"2.1.0"}',
      headLockJson: lockFor("2.1.0"),
      headChangelog: changelogFor("2.1.0"),
      headSecurityPolicy: policyFor("2.1.0"),
    }).error,
    /Expected version 2\.0\.3/,
  );
});

test("rejects inconsistent release artifacts", () => {
  const metadata = {
    basePackageJson,
    headPackageJson: '{"version":"2.0.3"}',
    headLockJson: lockFor("2.0.3"),
    headChangelog: changelogFor("2.0.3"),
    headSecurityPolicy: policyFor("2.0.3"),
  };

  assert.match(
    validateReleaseMetadata({ ...metadata, headLockJson: lockFor("2.0.2") }).error,
    /package-lock\.json/,
  );
  assert.match(
    validateReleaseMetadata({ ...metadata, headChangelog: changelogFor("2.0.3", "") }).error,
    /at least one bullet entry/,
  );
  assert.match(
    validateReleaseMetadata({ ...metadata, headSecurityPolicy: policyFor("2.0.2") }).error,
    /SECURITY\.md/,
  );
});

test("requires matching root package-lock versions", () => {
  assert.equal(readLockfilePackageVersion(lockFor("2.0.3")), "2.0.3");
  assert.equal(readLockfilePackageVersion("not JSON"), null);
  assert.equal(readLockfilePackageVersion('{"version":"2.0.3","packages":{}}'), null);
  assert.equal(
    readLockfilePackageVersion(
      JSON.stringify({ version: "2.0.3", packages: { "": { version: "2.0.2" } } }),
    ),
    null,
  );
});

test("rejects malformed base and head package versions", () => {
  const metadata = {
    basePackageJson,
    headPackageJson: '{"version":"2.0.3"}',
    headLockJson: lockFor("2.0.3"),
    headChangelog: changelogFor("2.0.3"),
    headSecurityPolicy: policyFor("2.0.3"),
  };

  assert.match(
    validateReleaseMetadata({ ...metadata, basePackageJson: '{"version":"invalid"}' }).error,
    /Base package\.json/,
  );
  assert.match(
    validateReleaseMetadata({ ...metadata, headPackageJson: '{"version":"invalid"}' }).error,
    /package\.json must contain a stable SemVer/,
  );
});

test("requires a non-empty changelog section for the release version", () => {
  assert.equal(validateChangelogForVersion(changelogFor("2.0.3"), "2.0.3").valid, true);
  assert.equal(validateChangelogForVersion(changelogFor("2.0.3", ""), "2.0.3").valid, false);
  assert.equal(validateChangelogForVersion(changelogFor("2.0.2"), "2.0.3").valid, false);
});

test("validates release metadata from an isolated git fixture", (t) => {
  const fixture = createReleaseMetadataFixture();
  t.after(() => rmSync(fixture, { force: true, recursive: true }));

  assert.deepEqual(validateReleaseMetadataFromGit({ baseRef: "HEAD", cwd: fixture }), {
    valid: true,
    version: "2.0.3",
    releaseType: "patch",
  });
  assert.match(
    validateReleaseMetadataFromGit({ baseRef: "missing-base-ref", cwd: fixture }).error,
    /Unable to read release metadata files/,
  );
});

test("validates release metadata through the command-line interface", (t) => {
  const fixture = createReleaseMetadataFixture();
  t.after(() => rmSync(fixture, { force: true, recursive: true }));

  const output = execFileSync(
    process.execPath,
    [releaseMetadataScript, "--base-ref", "HEAD"],
    { cwd: fixture, encoding: "utf8" },
  );

  assert.match(output, /Release metadata is valid for 2\.0\.3 \(patch\)/);
});

test("passes labels through the command-line interface and fails invalid metadata", (t) => {
  const fixture = createReleaseMetadataFixture();
  t.after(() => rmSync(fixture, { force: true, recursive: true }));

  const run = (...args) =>
    spawnSync(process.execPath, [releaseMetadataScript, ...args], {
      cwd: fixture,
      encoding: "utf8",
    });

  const minorRelease = run("--base-ref", "HEAD", "--labels", RELEASE_LABEL_MINOR);
  assert.equal(minorRelease.status, 1);
  assert.match(minorRelease.stderr, /Expected version 2\.1\.0 for a minor release/);

  const conflictingLabels = run(
    "--base-ref",
    "HEAD",
    "--labels",
    `${RELEASE_LABEL_MINOR},${RELEASE_LABEL_MAJOR}`,
  );
  assert.equal(conflictingLabels.status, 1);
  assert.match(conflictingLabels.stderr, /Use only one release label/);

  const invalidBase = run("--base-ref", "missing-base-ref");
  assert.equal(invalidBase.status, 1);
  assert.match(invalidBase.stderr, /Unable to read release metadata files/);
});

test("configures guarded default-branch npm trusted publishing", () => {
  const ciWorkflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const publishWorkflow = readFileSync(".github/workflows/publish.yml", "utf8");
  const releaseWorkflow = readFileSync(".github/workflows/release-metadata.yml", "utf8");

  assert.match(ciWorkflow, /Run release metadata validator tests/);
  assert.match(ciWorkflow, /Run release base reference tests/);
  assert.match(ciWorkflow, /fetch-depth: 0/);
  assert.match(publishWorkflow, /types: \[closed\]/);
  assert.match(publishWorkflow, /github\.event\.pull_request\.merged == true/);
  assert.match(
    publishWorkflow,
    /github\.event\.pull_request\.base\.ref == github\.event\.repository\.default_branch/,
  );
  assert.match(publishWorkflow, /id-token: write/);
  assert.match(publishWorkflow, /group: npm-publish/);
  assert.match(publishWorkflow, /ref: \$\{\{ github\.event\.pull_request\.merge_commit_sha \}\}/);
  assert.match(publishWorkflow, /npm publish --provenance --access public/);
  assert.match(publishWorkflow, /check-pull-request-approval\.mjs/);
  assert.match(publishWorkflow, /find-release-base-ref\.mjs/);
  assert.match(publishWorkflow, /validate-release-metadata\.mjs/);
  assert.match(publishWorkflow, /RELEASE_LABELS:/);
  assert.match(
    publishWorkflow,
    /BASE_REF="\$\(node scripts\/find-release-base-ref\.mjs "\$MERGE_COMMIT_SHA"\)"/,
  );
  assert.match(publishWorkflow, /npm view "eslint-plugin-no-emoji@\$\{VERSION\}" version/);
  assert.match(releaseWorkflow, /types: \[opened, synchronize, reopened, labeled, unlabeled\]/);
  assert.match(releaseWorkflow, /validate-release-metadata\.mjs/);
  assert.match(releaseWorkflow, /RELEASE_LABELS:/);
});
