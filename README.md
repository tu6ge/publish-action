# publish-action

Automatically publish a Rust crate to crates.io and create a matching Git tag when you push a new version in `Cargo.toml`.

Publishing a crate usually involves:

1. Bumping the version in `Cargo.toml`
2. Creating a Git tag
3. Running `cargo publish`
4. Pushing to GitHub

It is easy to forget the Git tag. This action checks whether the version is already on the registry, publishes when needed, and creates the tag for you.

You still only change the version in `Cargo.toml` and push; the workflow can run tests first, then this action.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `DIR` | No | `/` | Path to the crate directory, relative to the repository root (e.g. `/` for the root crate, `/project2/` for a sub-crate). |
| `TAG_PREFIX` | No | *(empty)* | Prefix for the Git tag created after a successful publish. The full tag is `{TAG_PREFIX}{version}` (for example `v` + `1.2.3` → `v1.2.3`). |
| `USER_AGENT` | No | *(none)* | Optional custom `User-Agent` string for GitHub API requests when creating the tag. |

Environment variables expected by the action:

| Variable | Description |
|----------|-------------|
| `GITHUB_TOKEN` | Token with permission to create refs (tags). `secrets.GITHUB_TOKEN` is typical. |
| `CARGO_REGISTRY_TOKEN` | crates.io API token used by `cargo publish`. |
| `GITHUB_REPOSITORY`, `GITHUB_REF_NAME`, `GITHUB_WORKSPACE` | Set automatically in GitHub Actions. |

## Outputs

Use these in later steps as `${{ steps.<step-id>.outputs.<name> }}`.

| Output | Values / presence | Meaning |
|--------|-------------------|---------|
| `new_version` | `true` or `false` | `false`: this `Cargo.toml` version is already on all configured publish registries (nothing to do). `true`: at least one registry does not have this version yet, so the action attempted `cargo publish`. |
| `publish` | `true` or `false` | Set only when `new_version` was `true`. `true`: `cargo publish` succeeded and the Git tag was created. `false`: `cargo publish` failed. |
| `new_version_value` | Semver string | Set only when `publish` is `true`. The version that was published (from `Cargo.toml`). |

Typical combinations:

- **Skip (already published):** `new_version=false`. `publish` and `new_version_value` are not written.
- **Published in this run:** `new_version=true`, `publish=true`, `new_version_value` is the released version.
- **Publish failed:** `new_version=true`, `publish=false`. `new_version_value` is not written; inspect logs and fix the crate or registry.

> **Note:** Outputs named `new_version` and `publish` are available from **v0.1.15** onward. `new_version_value` is set on successful publish so workflows can use the exact version string without re-parsing `Cargo.toml`.

## Usage

1. Create a token at [crates.io tokens](https://crates.io/settings/tokens) and copy it.

2. In the repository on GitHub, open **Settings → Environments** (`https://github.com/<owner>/<repo>/settings/environments`). Create an environment named `cargo` and add an environment secret `CARGO_REGISTRY_TOKEN` with the token from step 1.

3. Under **Settings → Actions → General → Workflow permissions**, enable **Read and write permissions** (needed to push tags), then save.

4. Add a workflow file (for example `.github/workflows/publish.yaml`):

```yaml
name: Publish to Cargo

on:
  push:
    branches: [ master ]

jobs:
  publish:
    runs-on: ubuntu-latest

    name: 'publish'

    environment: cargo

    steps:
      - uses: actions/checkout@master
        with:
          fetch-depth: 0

      - name: Run publish-action
        id: publish
        uses: tu6ge/publish-action@v0.5.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_REGISTRY_TOKEN }}
        with:
          USER_AGENT: "my-user-agent"

      - name: Example — only after a real publish
        if: steps.publish.outputs.publish == 'true'
        run: echo "Released ${{ steps.publish.outputs.new_version_value }}"
```

5. Push changes; on pushes that include a new unpublished version, the action will publish and tag.

## Alternate registries (v0.2+)

If the crate uses an alternate registry, see the Cargo book: [Using an alternate registry](https://doc.rust-lang.org/cargo/reference/registries.html#using-an-alternate-registry).

## Multiple crates in one repo (v0.3+)

Use a matrix with `DIR` and `TAG_PREFIX`:

```yaml
name: Publish to Cargo

on:
  push:
    branches: [ master ]

jobs:
  publish:
    runs-on: ubuntu-latest

    name: 'publish'

    environment: cargo

    strategy:
      fail-fast: false
      matrix:
        include:
          - dir: "/"
            tag_prefix: "v-"
          - dir: "/project2/"
            tag_prefix: "p2-"
          - dir: "/project3/"
            tag_prefix: "p3-"

    steps:
      - uses: actions/checkout@master
        with:
          fetch-depth: 0

      - name: Run publish-action
        uses: tu6ge/publish-action@v0.5.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_REGISTRY_TOKEN }}
        with:
          DIR: ${{ matrix.dir }}
          TAG_PREFIX: ${{ matrix.tag_prefix }}
```

If `DIR` is empty, the default is the repository root. If `TAG_PREFIX` is empty, the tag is exactly the version string (for example `1.2.3`).
