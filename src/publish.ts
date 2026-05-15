import * as exec from "@actions/exec";
import * as github from "@actions/github";

export async function cargoPublish(): Promise<void> {
  await exec.exec("cargo", ["publish"]);
}

export async function createTag(version: string, token: string): Promise<void> {
  const octokit = github.getOctokit(token);
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
