import * as exec from "@actions/exec";

async function readCargoMetadata(): Promise<{
  packages?: Array<{ name?: string; version?: string }>;
}> {
  let output = "";

  await exec.exec("cargo", ["metadata", "--no-deps", "--format-version", "1"], {
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
 * Name and version from `cargo metadata --no-deps` (`packages[0]`).
 * Single-crate layout only; workspace is not handled.
 */
export async function getCargoPackage(): Promise<{
  name: string;
  version: string;
}> {
  const metadata = await readCargoMetadata();
  const pkg = metadata.packages?.[0];

  if (!pkg?.name || !pkg?.version) {
    throw new Error("Could not read package name/version from Cargo.toml");
  }

  return { name: pkg.name, version: pkg.version };
}

export async function getCargoVersion(): Promise<string> {
  const { version } = await getCargoPackage();
  return version;
}
