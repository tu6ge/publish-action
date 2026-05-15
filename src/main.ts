import * as core from "@actions/core";
import { getCargoPackage } from "./cargo";
import { getLatestPublishedVersion } from "./registry";
import { cargoPublish, createTag } from "./publish";
import { shouldPublishNewVersion } from "./version";

async function run(): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    core.setFailed("GITHUB_TOKEN environment variable is required");
    return;
  }

  core.info("Reading package from Cargo.toml (cargo metadata)...");
  const { name, version, publishRegistries } = await getCargoPackage();
  core.info(`Package: ${name}@${version}`);
  core.info(`Publish registries: ${publishRegistries.join(", ")}`);

  let needsPublish = false;

  for (const registry of publishRegistries) {
    core.info(`Checking latest version on registry "${registry}"...`);
    const latest = await getLatestPublishedVersion(name, registry);
    core.info(
      latest
        ? `Latest on ${registry}: ${latest}`
        : `Crate not found on ${registry} (first publish there)`,
    );

    if (shouldPublishNewVersion(version, latest)) {
      core.info(
        latest
          ? `Local ${version} is newer than ${registry} ${latest}`
          : `Will publish ${version} to ${registry}`,
      );
      needsPublish = true;
    } else {
      core.info(
        `Local ${version} is not newer than ${registry} (${latest}); no publish needed for this registry.`,
      );
    }
  }

  if (!needsPublish) {
    core.info("No registry requires a new publish; skipping.");
    core.setOutput("new_version", "false");
    core.setOutput("publish", "false");
    return;
  }

  core.setOutput("new_version", "true");
  core.info(`Publishing to: ${publishRegistries.join(", ")}...`);

  try {
    await cargoPublish();
  } catch (err) {
    core.setFailed(`cargo publish failed: ${err}`);
    core.setOutput("publish", "false");
    return;
  }

  const tagPrefix = process.env.INPUT_TAG_PREFIX ?? "";
  const tag = `${tagPrefix}${version}`;

  core.info(`Creating tag ${tag}...`);
  try {
    await createTag(tag, githubToken);
  } catch (err) {
    core.setFailed(`Published successfully but failed to create tag: ${err}`);
    return;
  }

  core.setOutput("publish", "true");
  core.setOutput("new_version_value", version);
  core.info(`Successfully published ${name} ${version} and created tag ${tag}.`);
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
