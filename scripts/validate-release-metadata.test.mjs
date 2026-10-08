import assert from "node:assert/strict";
import test from "node:test";

import {
  RELEASE_LABEL_MAJOR,
  RELEASE_LABEL_MINOR,
  bumpSemVer,
  readLockfilePackageVersion,
  releaseTypeFromLabels,
  validateChangelogForVersion,
  validateReleaseMetadata,
} from "./validate-release-metadata.mjs";

const basePackageJson = '{"version":"2.0.2"}';
const supportedStatus = String.fromCodePoint(0x2713);

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
  assert.equal(
    readLockfilePackageVersion(
      JSON.stringify({ version: "2.0.3", packages: { "": { version: "2.0.2" } } }),
    ),
    null,
  );
});

test("requires a non-empty changelog section for the release version", () => {
  assert.equal(validateChangelogForVersion(changelogFor("2.0.3"), "2.0.3").valid, true);
  assert.equal(validateChangelogForVersion(changelogFor("2.0.3", ""), "2.0.3").valid, false);
  assert.equal(validateChangelogForVersion(changelogFor("2.0.2"), "2.0.3").valid, false);
});
