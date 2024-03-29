FROM rust:1-alpine3.14 as builder

LABEL com.github.actions.name="auto publish"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

WORKDIR /publish-action

RUN apk update
RUN apk add openssl-dev git libc-dev

RUN cargo install publish-action

ENTRYPOINT ["publish-action"]
