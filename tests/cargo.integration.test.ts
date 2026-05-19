import { execSync } from "node:child_process";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as core from "@actions/core";
import { getCargoPackage } from "../src/cargo";

vi.mock("@actions/core", () => ({
  getInput: vi.fn(),
}));

const fixtureWorkspace = join(__dirname, "fixtures/version-workspace");
const fixtureMember = join(fixtureWorkspace, "crates/member");

function hasCargoOnPath(): boolean {
  try {
    execSync("cargo --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const describeIntegration = hasCargoOnPath() ? describe : describe.skip;

describeIntegration("cargo metadata (integration)", () => {
  beforeEach(() => {
    process.env.GITHUB_WORKSPACE = fixtureWorkspace;
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      if (name === "DIR") return "/crates/member";
      return "";
    });
  });

  afterEach(() => {
    delete process.env.GITHUB_WORKSPACE;
    vi.mocked(core.getInput).mockReset();
  });

  it("resolves version.workspace from real cargo metadata", async () => {
    const pkg = await getCargoPackage();

    expect(pkg.name).toBe("member-fixture");
    expect(pkg.version).toBe("2.4.0");
    expect(pkg.publishRegistries).toEqual(["crates-io"]);
  });

  it("cargo metadata JSON lists member under fixture member directory", () => {
    const metadataJson = execSync(
      "cargo metadata --no-deps --format-version 1",
      { cwd: fixtureMember, encoding: "utf8" },
    );

    const metadata = JSON.parse(metadataJson) as {
      packages: Array<{ name: string; version: string; manifest_path: string }>;
    };
    const member = metadata.packages.find((p) => p.name === "member-fixture");

    expect(member?.version).toBe("2.4.0");
    expect(member?.manifest_path.startsWith(fixtureMember)).toBe(true);
  });
});
