import * as exec from "@actions/exec";

export async function getCargoVersion(): Promise<string> {
  let output = "";

  await exec.exec("cargo", ["metadata", "--no-deps", "--format-version", "1"], {
    listeners: {
      stdout: (data: Buffer) => {
        output += data.toString();
      },
    },
    silent: true,
  });

  const metadata = JSON.parse(output);

  // metadata.packages[0] is the root package when --no-deps is used
  const version: string | undefined = metadata?.packages?.[0]?.version;
  if (!version) {
    throw new Error("Could not read version from Cargo.toml");
  }

  return version;
}
