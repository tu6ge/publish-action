import * as core from "@actions/core";
import { getCargoVersion } from "./cargo";
import { getLatestTag, isNewVersion } from "./git";
import { cargoPublish, createTag } from "./publish";

async function run(): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    core.setFailed("GITHUB_TOKEN environment variable is required");
    return;
  }

  // Step 1: read current version from Cargo.toml
  core.info("Reading version from Cargo.toml...");
  const currentVersion = await getCargoVersion();
  core.info(`Current version: ${currentVersion}`);

  // Step 2: get latest published tag from GitHub
  core.info("Fetching latest tag from GitHub...");
  const latestTag = await getLatestTag(githubToken);
  core.info(
    latestTag ? `Latest tag: ${latestTag}` : "No tags found (first release)",
  );

  // Step 3: compare
  if (!isNewVersion(currentVersion, latestTag)) {
    core.info("No version change detected, skipping publish.");
    core.setOutput("new_version", "false");
    core.setOutput("publish", "false");
    return;
  }

  core.info(`New version detected: ${currentVersion}`);
  core.setOutput("new_version", "true");

  // Step 4: publish to crates.io
  core.info("Publishing to crates.io...");
  try {
    await cargoPublish();
  } catch (err) {
    core.setFailed(`cargo publish failed: ${err}`);
    core.setOutput("publish", "false");
    return;
  }

  core.setOutput("new_version_value", currentVersion);

  // Step 5: create git tag
  core.info(`Creating tag ${currentVersion}...`);
  try {
    await createTag(currentVersion, githubToken);
  } catch (err) {
    // Publish succeeded — don't fail the action, just warn
    core.warning(`Published successfully but failed to create tag: ${err}`);
  }

  core.setOutput("publish", "true");
  core.info(`Successfully published ${currentVersion} and created tag.`);
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
