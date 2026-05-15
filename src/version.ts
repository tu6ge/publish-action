import semver from "semver";

/**
 * True when `current` should be published to a registry: not on that registry yet,
 * or `current` is strictly newer than the latest version there.
 */
export function shouldPublishNewVersion(
  current: string,
  latestOnRegistry: string | null,
): boolean {
  if (!semver.valid(current)) {
    throw new Error(`Invalid semver in Cargo.toml: ${current}`);
  }

  if (latestOnRegistry === null) {
    return true;
  }

  if (!semver.valid(latestOnRegistry)) {
    throw new Error(
      `Invalid semver from registry latest version: ${latestOnRegistry}`,
    );
  }

  return semver.gt(current, latestOnRegistry);
}
