import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getLatestPublishedVersion,
  isVersionPublished,
} from "./crates";

describe("crates.io API", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("getLatestPublishedVersion", () => {
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

  describe("isVersionPublished", () => {
    it("returns true when version endpoint exists", async () => {
      vi.mocked(fetch).mockResolvedValue({
        status: 200,
        ok: true,
      } as Response);

      await expect(isVersionPublished("my-crate", "1.0.0")).resolves.toBe(true);
    });

    it("returns false when version is not published", async () => {
      vi.mocked(fetch).mockResolvedValue({
        status: 404,
        ok: false,
      } as Response);

      await expect(isVersionPublished("my-crate", "9.9.9")).resolves.toBe(false);
    });
  });
});
