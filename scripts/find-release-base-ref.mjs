import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readStablePackageVersion } from "./validate-security-policy-version.mjs";

function readPackageVersion(ref, cwd) {
  const packageJson = execFileSync("git", ["show", `${ref}:package.json`], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const version = readStablePackageVersion(packageJson);

  if (!version) {
    throw new Error(`package.json at ${ref} must contain a stable SemVer version.`);
  }

  return version;
}

function readFirstParent(ref, cwd) {
  return execFileSync("git", ["rev-parse", `${ref}^`], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

export function findReleaseBaseRef({ headRef = "HEAD", cwd = process.cwd() } = {}) {
  const releaseVersion = readPackageVersion(headRef, cwd);
  let candidateRef = headRef;

  while (readPackageVersion(candidateRef, cwd) === releaseVersion) {
    candidateRef = readFirstParent(candidateRef, cwd);
  }

  return candidateRef;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(`${findReleaseBaseRef({ headRef: process.argv[2] })}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Unable to find the release base commit: ${message}`);
    process.exitCode = 1;
  }
}
