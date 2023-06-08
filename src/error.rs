use thiserror::Error;

#[derive(Error, Debug)]
pub enum Perror {
    #[error("reqwest error")]
    Request(#[from] reqwest::Error),

    #[cfg(test)]
    #[error("{0}")]
    Dotenv(#[from] dotenv::Error),

    #[error("var error")]
    VarError(#[from] std::env::VarError),

    #[error("json error")]
    JsonError(#[from] serde_json::Error),

    #[error("input data is not valid")]
    Input(String),

    #[error("github api return error")]
    Github(String),

    #[error("io error {0}")]
    Io(#[from] std::io::Error),

    #[error("InvalidHeaderValue {0}")]
    InvalidHeaderValue(#[from] reqwest::header::InvalidHeaderValue),

    /// Cargo uses anyhow::Result which uses anyhow::Error, but not publically
    /// exposed, so we must match the version of anyhow with the one cargo gets
    /// built with.
    #[error("cargo library error {0}")]
    CargoError(#[from] anyhow::Error),

    #[error("Publishing disabled")]
    PublishingDisabled,

    #[error("get tag failed")]
    GetTagFailed,
}

pub type Presult<T> = Result<T, Perror>;
