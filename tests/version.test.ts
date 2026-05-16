import { describe, expect, it } from "vitest";
import { shouldPublishNewVersion } from "../src/version";

describe("shouldPublishNewVersion", () => {
  it("returns true when crate is not on crates.io", () => {
    expect(shouldPublishNewVersion("1.0.0", null)).toBe(true);
  });

  it("returns true when current is greater than latest", () => {
    expect(shouldPublishNewVersion("1.2.0", "1.1.9")).toBe(true);
    expect(shouldPublishNewVersion("2.0.0", "1.9.9")).toBe(true);
  });

  it("returns false when current equals latest", () => {
    expect(shouldPublishNewVersion("1.2.3", "1.2.3")).toBe(false);
  });

  it("returns false when current is older than latest", () => {
    expect(shouldPublishNewVersion("1.0.0", "1.2.0")).toBe(false);
  });

  it("throws on invalid local version", () => {
    expect(() => shouldPublishNewVersion("not-a-version", "1.0.0")).toThrow(
      "Invalid semver in Cargo.toml",
    );
  });
});
