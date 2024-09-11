FROM rust:1.76.0-alpine3.19

LABEL com.github.actions.name="auto publish"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

RUN apk update
RUN apk add openssl-dev git libc-dev

WORKDIR /publish

COPY . /publish

RUN cargo build --release

ENTRYPOINT ["/publish/target/publish/publish-action"]
