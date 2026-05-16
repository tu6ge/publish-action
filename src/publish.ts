import * as exec from "@actions/exec";
import * as github from "@actions/github";
import * as core from "@actions/core";
import { getCrateRoot } from "./workspace";

/** Publishes to every registry listed in `package.publish` (Cargo handles `--registry` internally). */
export async function cargoPublish(): Promise<void> {
  await exec.exec("cargo", ["publish"], { cwd: getCrateRoot() });
}

export async function createTag(version: string, token: string): Promise<void> {
  const customUa = core.getInput("USER_AGENT");
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
