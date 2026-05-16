import { afterEach, describe, expect, it, vi } from "vitest";
import * as core from "@actions/core";
import { getCrateRoot } from "../src/workspace";

vi.mock("@actions/core", () => ({
  getInput: vi.fn(),
}));

describe("getCrateRoot", () => {
  afterEach(() => {
    delete process.env.GITHUB_WORKSPACE;
    vi.mocked(core.getInput).mockReset();
  });

  it("returns GITHUB_WORKSPACE when DIR is empty or /", () => {
    process.env.GITHUB_WORKSPACE = "/repo";
    vi.mocked(core.getInput).mockReturnValue("");

    expect(getCrateRoot()).toBe("/repo");
    vi.mocked(core.getInput).mockReturnValue("/");
    expect(getCrateRoot()).toBe("/repo");
  });

  it("joins DIR relative to workspace", () => {
    process.env.GITHUB_WORKSPACE = "/repo";
    vi.mocked(core.getInput).mockReturnValue("/pkg");

    expect(getCrateRoot()).toBe("/repo/pkg");
  });
});
