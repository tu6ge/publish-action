FROM rust:1.80.0-alpine3.20

LABEL com.github.actions.name="auto publish"
LABEL com.github.actions.icon="package"
LABEL com.github.actions.color="blue"

LABEL version="0.1.0"
LABEL repository="http://github.com/tu6ge/publish-action"
LABEL homepage="http://github.com/tu6ge/publish-action"
LABEL maintainer="tu6ge <772364230@qq.com>"

RUN apk update
RUN apk add git libc-dev openssl-dev curl build-base

#RUN cp /etc/ssl/certs/ca-certificates.crt /etc/ssl/cert.pem
#COPY Amazon_Root_CA_1.pem /etc/ssl/certs/Amazon_Root_CA_1.pem
#RUN update-ca-certificates

RUN export RUSTFLAGS='-C target-feature=-crt-static'

WORKDIR /publish

COPY . /publish

RUN cargo build --release

ENTRYPOINT ["/publish/target/release/publish-action"]
