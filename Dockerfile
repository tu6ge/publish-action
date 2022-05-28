FROM ubuntu:latest

LABEL com.github.actions.name="auto publish"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

WORKDIR /publish-action
COPY . .

RUN apt update && apt install -y curl openssl libc6-dev git

# RUN apk update
# RUN apk add openssl-dev git libc-dev
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

RUN cargo build

#RUN chmod +x ./target/debug/publish-action

ENTRYPOINT ["/publish-action/target/debug/publish-action"]