import * as github from "@actions/github";

// Minimal semver comparison without external deps.
// Handles "1.2.3" format only — pre-release suffixes not needed for crates.io.
function parseSemver(tag: string): [number, number, number] {
  const parts = tag.split(".").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return [0, 0, 0];
  }
  return [parts[0], parts[1], parts[2]];
}

function compareSemver(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseSemver(a);
  const [bMajor, bMinor, bPatch] = parseSemver(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

export async function getLatestTag(token: string): Promise<string | null> {
  const octokit = github.getOctokit(token);
  const { owner, repo } = github.context.repo;

  // Fetch all tags — paginate to handle repos with many tags
  const tags = await octokit.paginate(octokit.rest.repos.listTags, {
    owner,
    repo,
    per_page: 100,
  });

  if (tags.length === 0) {
    return null;
  }

  // Sort by semver descending, pick the highest
  const sorted = tags
    .map((t) => t.name)
    .filter((name) => /^\d+\.\d+\.\d+$/.test(name)) // only plain semver tags
    .sort((a, b) => compareSemver(b, a)); // descending

  return sorted[0] ?? null;
}

// Returns true when currentVersion is strictly greater than the latest tag,
// or when there are no tags yet (first release).
export function isNewVersion(
  currentVersion: string,
  latestTag: string | null,
): boolean {
  if (latestTag === null) {
    return true;
  }
  return compareSemver(currentVersion, latestTag) > 0;
}
