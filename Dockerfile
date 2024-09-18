FROM rust:1.80.0-alpine3.20

LABEL com.github.actions.name="auto publish to crates.io"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

RUN apk update
RUN apk add build-base perl-dev pkgconfig openssl-dev
#openssl-dev

WORKDIR /publish

COPY . /publish

#RUN export RUSTFLAGS='-C target-feature=-crt-static'
#RUN export RUSTFLAGS="-C link-arg=-static"
RUN cargo build --release

ENTRYPOINT ["/publish/target/release/publish-action"]
