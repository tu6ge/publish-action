use thiserror::Error;

#[derive(Error, Debug)]
pub enum Perror {
    #[error("reqwest error")]
    Request(#[from] reqwest::Error),

    #[error("{0}")]
    Dotenv(#[from] dotenv::Error),

    #[error("var error")]
    VarError(#[from] std::env::VarError),

    #[error("json error")]
    JsonError(#[from] json::JsonError),

    #[error("input data is not valid")]
    Input(String),

    #[error("github api return error")]
    Github(String),

    #[error("io error {0}")]
    Io(#[from] std::io::Error),

    #[error("CargoToml error {0}")]
    CargoToml(#[from] cargo_toml::Error),

    #[error("InvalidHeaderValue {0}")]
    InvalidHeaderValue(#[from] reqwest::header::InvalidHeaderValue),

    #[error("crates io api error {0}")]
    CratesIoApi(#[from] crates_io_api::Error),
}

pub type Presult<T> = Result<T, Perror>;
