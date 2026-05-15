import { beforeEach, describe, expect, it, vi } from "vitest";
import * as exec from "@actions/exec";
import { getCargoPackage, getCargoVersion } from "./cargo";

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

describe("getCargoPackage", () => {
  beforeEach(() => {
    vi.mocked(exec.exec).mockReset();
  });

  it("returns name and version from packages[0]", async () => {
    mockCargoMetadata({
      packages: [{ name: "publish-action", version: "0.5.2" }],
    });

    await expect(getCargoPackage()).resolves.toEqual({
      name: "publish-action",
      version: "0.5.2",
    });
  });

  it("throws when packages[0] has no version", async () => {
    mockCargoMetadata({ packages: [{ name: "publish-action" }] });

    await expect(getCargoPackage()).rejects.toThrow(
      "Could not read package name/version from Cargo.toml",
    );
  });

  it("throws when packages is empty", async () => {
    mockCargoMetadata({ packages: [] });

    await expect(getCargoPackage()).rejects.toThrow(
      "Could not read package name/version from Cargo.toml",
    );
  });
});

describe("getCargoVersion", () => {
  beforeEach(() => {
    vi.mocked(exec.exec).mockReset();
  });

  it("returns version from packages[0]", async () => {
    mockCargoMetadata({
      packages: [{ name: "publish-action", version: "0.5.2" }],
    });

    await expect(getCargoVersion()).resolves.toBe("0.5.2");
  });
});
