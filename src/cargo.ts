import * as exec from "@actions/exec";
import { join } from "node:path";

const CRATES_IO = "crates-io";

interface CargoMetadataPackage {
  name?: string;
  version?: string;
  /** `null` → default crates.io; `[]` → publishing disabled */
  publish?: string[] | null;
}

function crateRoot(): string {
  const base = process.env.GITHUB_WORKSPACE ?? process.cwd();
  let dir = process.env.INPUT_DIR ?? "/";
  if (!dir.startsWith("/")) dir = `/${dir}`;
  if (dir !== "/" && dir.endsWith("/")) dir = dir.slice(0, -1);
  return dir === "/" ? base : join(base, dir);
}

async function readCargoMetadata(): Promise<{
  packages?: CargoMetadataPackage[];
}> {
  let output = "";

  await exec.exec("cargo", ["metadata", "--no-deps", "--format-version", "1"], {
    cwd: crateRoot(),
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    silent: true,
  });

  return JSON.parse(output);
}

/**
 * Registries this package may be published to (from `package.publish` in Cargo.toml).
 * @see https://doc.rust-lang.org/cargo/reference/registries.html#publishing-to-an-alternate-registry
 */
export function resolvePublishRegistries(
  publish: string[] | null | undefined,
): string[] {
  if (publish === null || publish === undefined) {
    return [CRATES_IO];
  }
  if (publish.length === 0) {
    throw new Error(
      "Publishing is disabled in Cargo.toml (package.publish is empty)",
    );
  }
  return publish;
}

/**
 * Name, version, and publish registries from `cargo metadata --no-deps` (`packages[0]`).
 */
export async function getCargoPackage(): Promise<{
  name: string;
  version: string;
  publishRegistries: string[];
}> {
  const metadata = await readCargoMetadata();
  const pkg = metadata.packages?.[0];

  if (!pkg?.name || !pkg?.version) {
    throw new Error("Could not read package name/version from Cargo.toml");
  }

  return {
    name: pkg.name,
    version: pkg.version,
    publishRegistries: resolvePublishRegistries(pkg.publish),
  };
}

export async function getCargoVersion(): Promise<string> {
  const { version } = await getCargoPackage();
  return version;
}
