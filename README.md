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

```
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

      # Use caching to speed up your build
      - name: Cache publish-action bin
        id: cache-publish-action
        uses: actions/cache@v3
        env:
          cache-name: cache-publish-action
        with:
          path: ~/.cargo
          key: ${{ runner.os }}-build-${{ env.cache-name }}-v0.2.0

      # install publish-action by cargo in github action
      - name: Install publish-action
        if: steps.cache-publish-action.outputs.cache-hit != 'true'
        run:
          cargo install publish-action --version=0.2.0
      
      - name: Run publish-action
        id: publish-action
        run:
          publish-action
        env:
          # This can help you tagging the github repository
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # This can help you publish to crates.io
          CARGO_REGISTRY_TOKEN: ${{ secrets.CARGO_REGISTRY_TOKEN }}

      #- name: Update Changelog.md
      #  if: steps.publish-action.outputs.new_version == 'true' && steps.publish-action.outputs.publish == 'true'
      #  run: |
      #    changelog -o Changelog.md
```

5. You can push to github with new github action. this is finished.

Now you change Cargo.toml, this can auto running.

## Support custom registries `+0.2`

using an alternate registry , This is [Documentation](https://doc.rust-lang.org/cargo/reference/registries.html#using-an-alternate-registry)
