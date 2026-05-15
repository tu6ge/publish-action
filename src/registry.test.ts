import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as exec from "@actions/exec";
import { getLatestPublishedVersion } from "./registry";

vi.mock("@actions/exec");
vi.mock("./crates", () => ({
  getLatestPublishedVersion: vi.fn(),
}));

import { getLatestPublishedVersion as getCratesIoLatest } from "./crates";

describe("getLatestPublishedVersion", () => {
  beforeEach(() => {
    vi.mocked(getCratesIoLatest).mockReset();
    vi.mocked(exec.exec).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("delegates crates-io to crates.io API", async () => {
    vi.mocked(getCratesIoLatest).mockResolvedValue("1.0.0");

    await expect(getLatestPublishedVersion("foo", "crates-io")).resolves.toBe(
      "1.0.0",
    );
    expect(getCratesIoLatest).toHaveBeenCalledWith("foo");
    expect(exec.exec).not.toHaveBeenCalled();
  });

  it("uses cargo info for alternate registries", async () => {
    vi.mocked(exec.exec).mockImplementation(async (_cmd, args, options) => {
      expect(args).toContain("my-registry");
      options?.listeners?.stdout?.(
        Buffer.from(JSON.stringify({ version: { num: "2.3.4" } })),
      );
      return 0;
    });

    await expect(
      getLatestPublishedVersion("my-crate", "my-registry"),
    ).resolves.toBe("2.3.4");
  });

  it("returns null when cargo info fails", async () => {
    vi.mocked(exec.exec).mockResolvedValue(1);

    await expect(
      getLatestPublishedVersion("new-crate", "my-registry"),
    ).resolves.toBeNull();
  });
});
