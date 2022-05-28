
use reqwest::blocking;
use dotenv::dotenv;
use std::{env};

use crate::error::{Perror,Presult};


pub fn client() -> Presult<String>{
  dotenv()?;

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

  let result = json::parse(&response.text()?)?;

  let sha: String = result[0]["object"]["sha"].to_string();

  Ok(sha)
}
