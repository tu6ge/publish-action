import * as exec from "@actions/exec";
import { join, resolve, sep } from "node:path";
import { getCrateRoot } from "./workspace";

const CRATES_IO = "crates-io";

export interface CargoMetadataPackage {
  name?: string;
  version?: string;
  manifest_path?: string;
  /** `null` → default crates.io; `[]` → publishing disabled */
  publish?: string[] | null;
}

export interface CargoMetadata {
  packages?: CargoMetadataPackage[];
}

async function readCargoMetadata(): Promise<CargoMetadata> {
  let output = "";

  await exec.exec("cargo", ["metadata", "--no-deps", "--format-version", "1"], {
    cwd: getCrateRoot(),
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    silent: true,
  });

  return JSON.parse(output) as CargoMetadata;
}

function manifestPathUnderCrateRoot(
  manifestPath: string,
  crateRoot: string,
): boolean {
  const root = resolve(crateRoot);
  const manifest = resolve(manifestPath);
  return manifest === root || manifest.startsWith(root + sep);
}

/**
 * Same rule as:
 * `jq -r --arg cwd "$PWD" '.packages[] | select(.manifest_path | startswith($cwd))'`
 */
export function resolvePackageFromMetadata(
  metadata: CargoMetadata,
  crateRoot: string,
): CargoMetadataPackage {
  const packages = metadata.packages ?? [];
  const matches = packages.filter(
    (p) => p.manifest_path && manifestPathUnderCrateRoot(p.manifest_path, crateRoot),
  );

  if (matches.length === 0) {
    throw new Error(
      `No package with manifest_path under crate root: ${crateRoot}`,
    );
  }

  const expectedManifest = resolve(join(crateRoot, "Cargo.toml"));
  const pkg =
    matches.find(
      (p) => p.manifest_path && resolve(p.manifest_path) === expectedManifest,
    ) ?? matches[0];

  if (!pkg.name || !pkg.version) {
    throw new Error("Could not read package name/version from Cargo.toml");
  }

  return pkg;
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
 * Name, version, and publish registries from `cargo metadata --no-deps`,
 * selecting the package whose `manifest_path` is under the crate root (`DIR` / workspace).
 */
export async function getCargoPackage(): Promise<{
  name: string;
  version: string;
  publishRegistries: string[];
}> {
  const crateRoot = getCrateRoot();
  const metadata = await readCargoMetadata();
  const pkg = resolvePackageFromMetadata(metadata, crateRoot);

  return {
    name: pkg.name!,
    version: pkg.version!,
    publishRegistries: resolvePublishRegistries(pkg.publish),
  };
}

export async function getCargoVersion(): Promise<string> {
  const { version } = await getCargoPackage();
  return version;
}
