> **Note for readers:** This file is **maintainer-only** notes. It is not end-user documentation for the action itself; it describes how this repository ships its Docker image to GHCR and publishes GitHub Releases. For using the action in your workflows, see `README.md`.

## 维护备忘：Docker 镜像与 GitHub Release（本仓库）

面向维护者：发 Docker 与发 GitHub Release **拆成两步**，**不**在「只打 tag」时自动推镜像；`action.yml` 里的 `runs.image` 版本需要**手动改**后再提交。

### 涉及的工作流

| 工作流 | 触发方式 | 作用 |
|--------|----------|------|
| `Docker build (dry run)` | 分支 `push` / `pull_request` | 仅验证 Dockerfile 能否构建成功，**不上传**镜像。 |
| `Publish Docker image to GHCR` | **Actions 里手动 Run workflow** | 跑 fmt / clippy / build / test 后，把镜像推到 **GHCR**；需在输入框填写 **`image_tag`**（例如 `v0.4.15`），该标签即为镜像在 registry 上的 tag。**不会**创建 git tag，**不会**发 GitHub Release。 |
| `Tag release` | **推送 git tag**（如 `git push origin v0.4.15`） | 再跑一遍 fmt / clippy / build / test，用 **git-cliff** 生成说明，并创建 **GitHub Release**（挂在当前 tag 上）。**不会**在此 job 里推 Docker 镜像。 |

### 推荐操作顺序（备忘）

1. **合并发版用的代码**到默认分支（如 `master`），确认 `Cargo.toml` 版本等无误。  
2. 打开 GitHub **Actions → Publish Docker image to GHCR → Run workflow**，在 **`image_tag`** 中填写与本次发版一致的标签（例如 **`v0.4.15`**，需与后续 git tag、以及 `action.yml` 里镜像后缀一致）。等待镜像构建并出现在 GHCR。  
3. **本地或网页编辑 `action.yml`**，把 `runs.image` 一行里的镜像 tag 改成上一步使用的 **`image_tag`**，提交并推送到默认分支，让市场/文档里引用的 action 指向刚上传的镜像。  
4. 需要对外发 Release 说明时，在已包含上述改动的历史上 **`git tag <同上标签>`** 并 **`git push origin <标签>`**（例如 `v0.4.15`）。推送 tag 会触发 **`Tag release`**，自动生成 changelog 并创建 **GitHub Release**。  

### 注意

- **`image_tag`（手动发布时填写的标签）、`action.yml` 里 `image:` 的镜像标签、以及最终推送的 git tag 三者应一致**，否则使用者 `uses: ...@v0.4.15` 拉到的 action 元数据与 GHCR 实际镜像会对不上。  
- 向 GHCR 推送需要 workflow 具备 **`packages: write`**（`docker-publish.yml` 已声明）；若组织策略限制默认 `GITHUB_TOKEN`，需在仓库或组织设置中允许写入 Packages。  
- 若先有 **git tag** 再补镜像，只要保证最终 **`action.yml` 与 GHCR 对齐** 即可；本流程刻意把「推镜像」放在手动按钮一步，便于控制发版节奏。
- **成功通知**：工作流成功后会写入 **Job Summary**（在 Actions 本次运行页面顶部摘要区可见）。
