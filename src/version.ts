import semver from "semver";

/**
 * True when `current` should be published: crate not on crates.io yet, or
 * `current` is strictly newer than the latest version on crates.io.
 */
export function shouldPublishNewVersion(
  current: string,
  latestOnCratesIo: string | null,
): boolean {
  if (!semver.valid(current)) {
    throw new Error(`Invalid semver in Cargo.toml: ${current}`);
  }

  if (latestOnCratesIo === null) {
    return true;
  }

  if (!semver.valid(latestOnCratesIo)) {
    throw new Error(
      `Invalid semver from crates.io max_version: ${latestOnCratesIo}`,
    );
  }

  return semver.gt(current, latestOnCratesIo);
}
