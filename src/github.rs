
use reqwest::blocking;
use dotenv::dotenv;
use std::{env};
use thiserror::Error;

pub fn client() -> Result<(), Perror>{
  dotenv().ok();

  let client = blocking::Client::new();
  let token = env::var("GITHUB_TOKEN")?;
  let mut auth = String::from("token ");
  auth.push_str(&token);

  let response = client.get("https://api.github.com/repos/tu6ge/oss/git/matching-refs/heads/master")
    .header("Authorization", auth)
    .header("User-Agent","tu6ge(772364230@qq.com)")
    .header("Accept", "application/vnd.github.v3+json")
    .send()?;
  
  if response.status() != 200 {
    return Err(Perror::Github(response.text()?));
  }

  println!("Got response: {}", response.text()?);
  Ok(())
}


#[derive(Error, Debug)]
pub enum Perror{
  #[error("reqwest error")]
  Request(#[from] reqwest::Error),

  #[error("var error")]
  VarError(#[from] std::env::VarError),

  #[error("input data is not valid")]
  Input(String),

  #[error("github api return error")]
  Github(String),

  #[error(transparent)]
  Other(#[from] anyhow::Error),
}