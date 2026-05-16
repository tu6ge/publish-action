import { beforeEach, describe, expect, it, vi } from "vitest";
import * as exec from "@actions/exec";
import {
  getCargoPackage,
  getCargoVersion,
  resolvePublishRegistries,
} from "../src/cargo";

vi.mock("@actions/core", () => ({
  getInput: vi.fn(() => ""),
}));

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

describe("resolvePublishRegistries", () => {
  it("defaults to crates-io when publish is omitted", () => {
    expect(resolvePublishRegistries(null)).toEqual(["crates-io"]);
    expect(resolvePublishRegistries(undefined)).toEqual(["crates-io"]);
  });

  it("uses explicit registry list from Cargo.toml", () => {
    expect(resolvePublishRegistries(["my-registry"])).toEqual(["my-registry"]);
    expect(resolvePublishRegistries(["a", "b"])).toEqual(["a", "b"]);
  });

  it("throws when publish is empty", () => {
    expect(() => resolvePublishRegistries([])).toThrow(
      "Publishing is disabled",
    );
  });
});

describe("getCargoPackage", () => {
  beforeEach(() => {
    vi.mocked(exec.exec).mockReset();
  });

  it("returns name, version, and publish registries", async () => {
    mockCargoMetadata({
      packages: [
        {
          name: "my-crate",
          version: "0.5.2",
          publish: ["my-registry"],
        },
      ],
    });

    await expect(getCargoPackage()).resolves.toEqual({
      name: "my-crate",
      version: "0.5.2",
      publishRegistries: ["my-registry"],
    });
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
