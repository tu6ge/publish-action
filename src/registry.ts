import * as exec from "@actions/exec";
import { getLatestPublishedVersion as getCratesIoLatest } from "./crates";
import { getCrateRoot } from "./workspace";

const CRATES_IO = "crates-io";

interface CargoInfoJson {
  version?: { num?: string };
}

/**
 * Latest published version on a registry.
 * - `crates-io`: crates.io HTTP API (`max_version`)
 * - other: `cargo info --registry <name> --format=json` (needs `.cargo/config.toml` index on the runner)
 */
export async function getLatestPublishedVersion(
  crateName: string,
  registry: string,
): Promise<string | null> {
  if (registry === CRATES_IO) {
    return getCratesIoLatest(crateName);
  }
  return getLatestViaCargoInfo(crateName, registry);
}

async function getLatestViaCargoInfo(
  crateName: string,
  registry: string,
): Promise<string | null> {
  let output = "";
  const code = await exec.exec(
    "cargo",
    ["info", crateName, "--registry", registry, "--format=json", "-q"],
    {
      cwd: getCrateRoot(),
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
      silent: true,
      ignoreReturnCode: true,
    },
  );

  if (code !== 0 || !output.trim()) {
    return null;
  }

  try {
    const data = JSON.parse(output) as CargoInfoJson;
    return data.version?.num ?? null;
  } catch {
    return null;
  }
}
