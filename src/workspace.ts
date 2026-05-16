import * as core from "@actions/core";
import { join } from "node:path";

/**
 * Absolute path to the crate root (`GITHUB_WORKSPACE` + `DIR` input).
 * Single definition — keep in sync with `action.yml` input `DIR`.
 */
export function getCrateRoot(): string {
  const base = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const dir = core.getInput("DIR").trim();

  if (!dir || dir === "/") {
    return base;
  }

  const relative = dir.startsWith("/") ? dir.slice(1) : dir;
  return join(base, relative);
}
