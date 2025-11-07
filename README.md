# publish-action

Auto Publish Cargo with Github Action

If you have a cargo repository, When you publish new version, The following steps are usually required:

1. Update version in Cargo.toml
2. Tagging the repository
3. Publish to crates.io
4. Push to github

Sometimes, We forget to tagging the github repository. So I created the github action.

Now, you only need update version in Cargo.toml, after you push to github, the github action can auto tagging the github repository,
and publish to crates.io with new version.

Before you publish, you can also run test case.
## Outputs (0.1.15 +)

After run the action, you can judge the state (find new version or not, publish success or failure) with outputs.

- `new_version`: return 'true' or 'false'
- `publish`: return 'true' or 'false'

## Usage

1. You should create a crates.io's token in https://crates.io/settings/tokens . and copy the token.

2. Open you repository settings page, find Environments Settings Page(https://github.com/xxx/xxx/settings/environments). Create a new environments width
name is `cargo`, and add a environment secrets namd `CARGO_REGISTRY_TOKEN`, this value is step one's token.

3. Open actions settings, select **Read and write permissions** option in *Workflow permissions*, and save it.

4. open you local repository path, create a new github action setting file, example: `publish.yaml` in `.github/workflows` path. and write :

```yaml
name: Publish to Cargo

on:
  push:
    branches: [ master ]

jobs:
  publish:
    runs-on: ubuntu-latest

    name: 'publish'

    # Reference your environment variables
    environment: cargo

    steps:
      - uses: actions/checkout@master
        with:
          # get git tags info
          fetch-depth: 0
      
      - name: Run publish-action
        uses: tu6ge/publish-action@v0.4.13
        env:
          # This can help you tagging the github repository
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # This can help you publish to crates.io
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_REGISTRY_TOKEN }}
        with:
          # custom user agent of github api (optional)
          USER_AGENT: "my user agent"
```

5. You can push to github with new github action. this is finished.

Now you change Cargo.toml, this can auto running.

## Support custom registries `+0.2`

using an alternate registry , This is [Documentation](https://doc.rust-lang.org/cargo/reference/registries.html#using-an-alternate-registry)

## Support multiple projects `+0.3`

This is an example:
```yaml
name: Publish to Cargo

on:
  push:
    branches: [ master ]

jobs:
  publish:
    runs-on: ubuntu-latest

    name: 'publish'

    # Reference your environment variables
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
          # get git tags info
          fetch-depth: 0
      
      - name: Run publish-action
        uses: tu6ge/publish-action@v0.4.13
        env:
          # This can help you tagging the github repository
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # This can help you publish to crates.io
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_REGISTRY_TOKEN }}
        with:
          DIR: ${{ matrix.dir }}
          TAG_PREFIX: ${{ matrix.tag_prefix }}
```

if `DIR` is empty, this default is root dir, if `TAG_PREFIX` is empty, tag prefix is none, and finaly tag is only `x.x.x` .

