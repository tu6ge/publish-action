import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as core from "@actions/core";
import * as exec from "@actions/exec";
import {
  getCargoPackage,
  getCargoVersion,
  resolvePackageFromMetadata,
  resolvePublishRegistries,
} from "../src/cargo";

vi.mock("@actions/core", () => ({
  getInput: vi.fn(() => ""),
}));

vi.mock("@actions/exec");

function mockCargoMetadata(payload: unknown): void {
  vi.mocked(exec.exec).mockImplementation(async (_cmd, args, options) => {
    expect(args).toEqual(["metadata", "--no-deps", "--format-version", "1"]);
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

describe("resolvePackageFromMetadata", () => {
  const repo = "/repo";

  it("selects package whose manifest_path is under crate root", () => {
    const metadata = {
      packages: [
        {
          name: "lib",
          version: "0.1.0",
          manifest_path: "/repo/crates/lib/Cargo.toml",
        },
        {
          name: "app",
          version: "0.5.2",
          manifest_path: "/repo/crates/app/Cargo.toml",
        },
      ],
    };

    expect(
      resolvePackageFromMetadata(metadata, "/repo/crates/app").name,
    ).toBe("app");
    expect(
      resolvePackageFromMetadata(metadata, "/repo/crates/app").version,
    ).toBe("0.5.2");
  });

  it("prefers Cargo.toml at crate root when multiple paths match", () => {
    const metadata = {
      packages: [
        {
          name: "nested",
          version: "9.9.9",
          manifest_path: "/repo/pkg/nested/Cargo.toml",
        },
        {
          name: "pkg",
          version: "1.0.0",
          manifest_path: "/repo/pkg/Cargo.toml",
        },
      ],
    };

    const pkg = resolvePackageFromMetadata(metadata, "/repo/pkg");
    expect(pkg.name).toBe("pkg");
    expect(pkg.version).toBe("1.0.0");
  });

  it("throws when no package matches crate root", () => {
    expect(() =>
      resolvePackageFromMetadata(
        {
          packages: [
            {
              name: "other",
              version: "1.0.0",
              manifest_path: "/other/Cargo.toml",
            },
          ],
        },
        repo,
      ),
    ).toThrow("No package with manifest_path under crate root");
  });
});

describe("getCargoPackage", () => {
  beforeEach(() => {
    vi.mocked(exec.exec).mockReset();
    process.env.GITHUB_WORKSPACE = "/repo";
    vi.mocked(core.getInput).mockReturnValue("/crates/app");
  });

  afterEach(() => {
    delete process.env.GITHUB_WORKSPACE;
    vi.mocked(core.getInput).mockReset();
  });

  it("returns name, version, and publish registries", async () => {

    mockCargoMetadata({
      packages: [
        {
          name: "lib",
          version: "0.1.0",
          manifest_path: "/repo/crates/lib/Cargo.toml",
        },
        {
          name: "my-crate",
          version: "0.5.2",
          manifest_path: "/repo/crates/app/Cargo.toml",
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
    process.env.GITHUB_WORKSPACE = "/repo";
    vi.mocked(core.getInput).mockReturnValue("");
  });

  afterEach(() => {
    delete process.env.GITHUB_WORKSPACE;
    vi.mocked(core.getInput).mockReset();
  });

  it("returns version from package under crate root", async () => {

    mockCargoMetadata({
      packages: [
        {
          name: "publish-action",
          version: "0.5.2",
          manifest_path: "/repo/Cargo.toml",
        },
      ],
    });

    await expect(getCargoVersion()).resolves.toBe("0.5.2");
  });
});
