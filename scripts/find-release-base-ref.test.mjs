import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { findReleaseBaseRef } from "./find-release-base-ref.mjs";

const findReleaseBaseRefScript = fileURLToPath(new URL("./find-release-base-ref.mjs", import.meta.url));

function runGit(cwd, args) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();
}

function commitPackageVersion(directory, version, message) {
  writeFileSync(join(directory, "package.json"), `{"version":"${version}"}\n`);
  runGit(directory, ["add", "package.json"]);
  runGit(directory, ["commit", "-m", message]);
}

function createReleaseHistory() {
  const directory = mkdtempSync(join(tmpdir(), "release-base-ref-"));

  runGit(directory, ["init", "--initial-branch=main"]);
  runGit(directory, ["config", "user.email", "test@example.com"]);
  runGit(directory, ["config", "user.name", "Test User"]);
  commitPackageVersion(directory, "2.0.2", "base");
  const baseRef = runGit(directory, ["rev-parse", "HEAD"]);
  commitPackageVersion(directory, "2.0.3", "release");
  writeFileSync(join(directory, "release-notes.txt"), "Release notes\n");
  runGit(directory, ["add", "release-notes.txt"]);
  runGit(directory, ["commit", "-m", "docs"]);

  return { baseRef, directory };
}

test("finds the commit before a release across subsequent rebased commits", (t) => {
  const history = createReleaseHistory();
  t.after(() => rmSync(history.directory, { force: true, recursive: true }));

  assert.equal(findReleaseBaseRef({ cwd: history.directory }), history.baseRef);

  const output = execFileSync(process.execPath, [findReleaseBaseRefScript], {
    cwd: history.directory,
    encoding: "utf8",
  });
  assert.equal(output.trim(), history.baseRef);
});
