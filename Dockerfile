FROM ubuntu:22.04

LABEL com.github.actions.name="auto publish"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

RUN apt update
RUN apt install -y curl build-essential pkg-config libssl-dev \
&& apt-get clean \
&& rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable

# 设置环境变量
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /publish

COPY . /publish

RUN cargo build --release

ENTRYPOINT ["/publish/target/release/publish-action"]
