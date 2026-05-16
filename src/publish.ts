import * as exec from "@actions/exec";
import * as github from "@actions/github";
import { join } from "node:path";

function crateRoot(): string {
  const base = process.env.GITHUB_WORKSPACE ?? process.cwd();
  let dir = process.env.INPUT_DIR ?? "/";
  if (!dir.startsWith("/")) dir = `/${dir}`;
  if (dir !== "/" && dir.endsWith("/")) dir = dir.slice(0, -1);
  return dir === "/" ? base : join(base, dir);
}

/** Publishes to every registry listed in `package.publish` (Cargo handles `--registry` internally). */
export async function cargoPublish(): Promise<void> {
  await exec.exec("cargo", ["publish"], { cwd: crateRoot() });
}

export async function createTag(version: string, token: string): Promise<void> {
  const customUa = process.env.INPUT_USER_AGENT;
  const octokit = github.getOctokit(
    token,
    customUa ? { userAgent: customUa } : undefined,
  );
  const { owner, repo } = github.context.repo;
  const sha = github.context.sha;

  // Create a lightweight tag via the Git refs API
  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/tags/${version}`,
    sha,
  });
}
