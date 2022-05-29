FROM rust:1-alpine3.14 as builder

LABEL com.github.actions.name="auto publish"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

WORKDIR /publish-action
COPY . .

RUN apk update
RUN apk add openssl-dev git libc-dev

RUN cargo install --path .

# FROM ubuntu:latest
# #RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
# COPY --from=builder /usr/local/cargo/bin/publish-action /usr/local/bin/publish-action

CMD ["publish-action"]
