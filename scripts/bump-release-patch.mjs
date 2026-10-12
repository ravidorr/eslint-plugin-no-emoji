import { readFileSync, writeFileSync } from "node:fs";

const changelogBullet = process.argv[2];
const date = process.argv[3] ?? "2026-10-13";

if (!changelogBullet) {
  console.error("Usage: bump-release-patch.mjs <changelog-bullet> [date]");
  process.exit(1);
}

const pkgPath = "package.json";
const lockPath = "package-lock.json";
const securityPath = "SECURITY.md";
const changelogPath = "CHANGELOG.md";

const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const baseVersion = pkg.version;
const parts = baseVersion.split(".").map(Number);
parts[2] += 1;
const version = parts.join(".");

pkg.version = version;
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
lock.version = version;
if (lock.packages?.[""]) {
  lock.packages[""].version = version;
}
writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

let security = readFileSync(securityPath, "utf8");
security = security.replace(
  /\| [0-9]+\.[0-9]+\.[0-9]+ \| ✓ \|/,
  `| ${version} | ✓ |`,
);
writeFileSync(securityPath, security);

const section = `## [${version}] - ${date}

### Changed

- ${changelogBullet}

`;

let changelog = readFileSync(changelogPath, "utf8");
changelog = changelog.replace("## [Unreleased]\n\n", `## [Unreleased]\n\n${section}`);

const oldUnreleased = `[Unreleased]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v${baseVersion}...HEAD`;
const newUnreleased = `[Unreleased]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v${version}...HEAD`;
const newVersionLink = `[${version}]: https://github.com/ravidorr/eslint-plugin-no-emoji/compare/v${baseVersion}...v${version}`;

if (!changelog.includes(oldUnreleased)) {
  throw new Error(`Expected changelog link not found: ${oldUnreleased}`);
}

changelog = changelog.replace(
  oldUnreleased,
  `${newUnreleased}\n${newVersionLink}`,
);

writeFileSync(changelogPath, changelog);
console.log(version);
