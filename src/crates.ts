const CRATES_IO = "https://crates.io/api/v1";

function userAgent(): string {
  return (
    process.env.INPUT_USER_AGENT ||
    "publish-action (https://github.com/tu6ge/publish-action)"
  );
}

async function cratesFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "User-Agent": userAgent(),
      Accept: "application/json",
    },
  });
}

/**
 * Latest release on crates.io (`crate.max_version`), or null if the crate does not exist.
 */
export async function getLatestPublishedVersion(
  crateName: string,
): Promise<string | null> {
  const res = await cratesFetch(
    `${CRATES_IO}/crates/${encodeURIComponent(crateName)}`,
  );

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`crates.io ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as { crate?: { max_version?: string } };
  return data.crate?.max_version ?? null;
}

/**
 * Whether `version` is already published for this crate on crates.io.
 */
export async function isVersionPublished(
  crateName: string,
  version: string,
): Promise<boolean> {
  const res = await cratesFetch(
    `${CRATES_IO}/crates/${encodeURIComponent(crateName)}/${encodeURIComponent(version)}`,
  );

  if (res.status === 404) {
    return false;
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`crates.io ${res.status}: ${body.slice(0, 500)}`);
  }

  return true;
}
