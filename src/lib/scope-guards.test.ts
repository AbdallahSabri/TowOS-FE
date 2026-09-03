// FE-SPEC.md §13 cut-scope guards that are about the shape of the file
// tree rather than JS/TS syntax an ESLint rule can see — see eslint-rules/
// for the AST-based half of each row (no-offline-apis.mjs,
// no-geolocation.mjs, and friends).

import { readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// This file lives at src/lib/scope-guards.test.ts — two levels up is the repo root.
const REPO_ROOT = path.resolve(__dirname, "../..");

function fileExists(relativePath: string): boolean {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  try {
    return readdirSync(path.dirname(absolutePath)).includes(path.basename(absolutePath));
  } catch {
    return false;
  }
}

function listDirectoriesRecursively(dir: string): string[] {
  let entries: import("node:fs").Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const dirs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    dirs.push(full);
    dirs.push(...listDirectoriesRecursively(full));
  }
  return dirs;
}

describe("cut-scope guards (FE-SPEC.md §13)", () => {
  it("ships no manifest file — no offline support (§9.2)", () => {
    const bannedManifestPaths = [
      "public/manifest.json",
      "public/manifest.webmanifest",
      "src/app/manifest.ts",
      "src/app/manifest.tsx",
      "src/app/manifest.webmanifest",
    ];

    for (const relativePath of bannedManifestPaths) {
      expect(fileExists(relativePath), `${relativePath} must not exist — no offline support`).toBe(
        false,
      );
    }
  });

  it("has no route under a driver path — no driver client (ADR-006)", () => {
    const appDir = path.join(REPO_ROOT, "src/app");
    const driverDirs = listDirectoriesRecursively(appDir).filter((dir) =>
      /^drivers?$/i.test(path.basename(dir)),
    );

    expect(driverDirs, `found driver route(s): ${driverDirs.join(", ")}`).toHaveLength(0);
  });
});
