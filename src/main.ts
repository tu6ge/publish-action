import * as core from "@actions/core";
import { getCargoPackage } from "./cargo";
import { getLatestPublishedVersion, isVersionPublished } from "./crates";
import { cargoPublish, createTag } from "./publish";

async function run(): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    core.setFailed("GITHUB_TOKEN environment variable is required");
    return;
  }

  core.info("Reading package from Cargo.toml (cargo metadata)...");
  const { name, version } = await getCargoPackage();
  core.info(`Package: ${name}@${version}`);

  core.info("Checking crates.io for published versions...");
  const latestPublished = await getLatestPublishedVersion(name);
  core.info(
    latestPublished
      ? `Latest on crates.io: ${latestPublished}`
      : "Crate not found on crates.io (first publish)",
  );

  const alreadyPublished = await isVersionPublished(name, version);
  if (alreadyPublished) {
    core.info(
      `Version ${version} is already published on crates.io; skipping publish.`,
    );
    core.setOutput("new_version", "false");
    core.setOutput("publish", "false");
    return;
  }

  core.info(`Version ${version} is not on crates.io yet; publishing...`);
  core.setOutput("new_version", "true");

  try {
    await cargoPublish();
  } catch (err) {
    core.setFailed(`cargo publish failed: ${err}`);
    core.setOutput("publish", "false");
    return;
  }

  core.info(`Creating tag ${version}...`);
  try {
    await createTag(version, githubToken);
  } catch (err) {
    core.setFailed(`Published successfully but failed to create tag: ${err}`);
    return;
  }

  core.setOutput("publish", "true");
  core.setOutput("new_version_value", version);
  core.info(`Successfully published ${name} ${version} and created tag.`);
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
