use thiserror::Error;

#[derive(Error, Debug)]
pub enum Perror{
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
  Github(String)
}

pub type Presult<T> = Result<T,Perror>;