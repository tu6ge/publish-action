FROM rust:1.89-alpine3.20 as builder

RUN apk update && \
    apk add --no-cache build-base perl-dev pkgconfig openssl-dev

WORKDIR /publish

# 先拷贝依赖文件，利用 Docker 缓存层
COPY Cargo.toml Cargo.lock ./
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf target/release/deps/publish_action*

# 拷贝源码并构建
COPY src ./src
RUN cargo build --release

# 运行阶段 - 使用更小的基础镜像
FROM alpine:3.20

LABEL com.github.actions.name="auto publish to crates.io"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

RUN apk add --no-cache libgcc openssl-dev

WORKDIR /app

# 从构建阶段只拷贝二进制文件
COPY --from=builder /publish/target/release/publish-action /app/

ENTRYPOINT ["/app/publish-action"]
