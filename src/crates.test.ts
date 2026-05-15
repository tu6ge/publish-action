import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getLatestPublishedVersion } from "./crates";

describe("getLatestPublishedVersion", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns max_version when crate exists", async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({ crate: { max_version: "1.2.3" } }),
    } as Response);

    await expect(getLatestPublishedVersion("my-crate")).resolves.toBe("1.2.3");
  });

  it("returns null when crate does not exist", async () => {
    vi.mocked(fetch).mockResolvedValue({
      status: 404,
      ok: false,
    } as Response);

    await expect(getLatestPublishedVersion("new-crate")).resolves.toBeNull();
  });
});
