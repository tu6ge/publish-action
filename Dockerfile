# `cargo` crate 的传递依赖需要较新的 rustc（见 Cargo 解析的 MSRV）；用 stable 避免与 1.89 等旧工具链冲突
FROM rust:1.93-alpine AS builder

RUN apk update && \
    apk add --no-cache build-base perl-dev pkgconfig openssl-dev

WORKDIR /publish

# 先拷贝依赖文件，利用 Docker 缓存层
COPY Cargo.toml ./
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf target/release/deps/publish_action*

# 拷贝源码并构建
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim

LABEL com.github.actions.name="auto publish to crates.io"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      libssl3 \
      curl \
      git \
      # 用户项目的常见系统依赖
      build-essential \
      pkg-config \
      cmake \
      libssl-dev \
      libfontconfig1-dev \
      libfreetype6-dev \
      libasound2-dev \
      libwayland-dev \
      libxkbcommon-dev \
      libx11-dev \
      libgl1-mesa-dev \
    && rm -rf /var/lib/apt/lists/*

# 把 cargo/rustup 从 builder 带过来，让容器内可以执行 cargo publish
COPY --from=builder /usr/local/cargo /usr/local/cargo
COPY --from=builder /usr/local/rustup /usr/local/rustup

ENV PATH="/usr/local/cargo/bin:$PATH"
ENV RUSTUP_HOME="/usr/local/rustup"
ENV CARGO_HOME="/usr/local/cargo"

WORKDIR /app
COPY --from=builder /publish/target/release/publish-action /app/

ENTRYPOINT ["/app/publish-action"]
