import { beforeEach, describe, expect, it, vi } from "vitest";
import * as exec from "@actions/exec";
import { getCargoVersion } from "./cargo";

vi.mock("@actions/exec");

function mockCargoMetadata(payload: unknown): void {
  vi.mocked(exec.exec).mockImplementation(async (_cmd, _args, options) => {
    const stdout = options?.listeners?.stdout;
    if (stdout) {
      stdout(Buffer.from(JSON.stringify(payload)));
    }
    return 0;
  });
}

describe("getCargoVersion", () => {
  beforeEach(() => {
    vi.mocked(exec.exec).mockReset();
  });

  it("returns version from cargo metadata packages[0]", async () => {
    mockCargoMetadata({ packages: [{ version: "0.5.2" }] });

    await expect(getCargoVersion()).resolves.toBe("0.5.2");
    expect(exec.exec).toHaveBeenCalledWith(
      "cargo",
      ["metadata", "--no-deps", "--format-version", "1"],
      expect.objectContaining({ silent: true }),
    );
  });

  it("throws when packages[0] has no version", async () => {
    mockCargoMetadata({ packages: [{ name: "publish-action" }] });

    await expect(getCargoVersion()).rejects.toThrow(
      "Could not read version from Cargo.toml",
    );
  });

  it("throws when packages is empty", async () => {
    mockCargoMetadata({ packages: [] });

    await expect(getCargoVersion()).rejects.toThrow(
      "Could not read version from Cargo.toml",
    );
  });
});
