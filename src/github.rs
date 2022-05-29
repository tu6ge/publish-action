/**!
 * # Github API SDK
 */
extern crate openssl;

use reqwest::{blocking, Method};
use dotenv::dotenv;
use std::{env};
use json::JsonValue;
use std::collections::HashMap;

use crate::error::{Perror,Presult};

pub struct Github<'a>{
  repositroy: &'a str,
  token: &'a str,
}

impl <'a> Github<'a>{

  pub fn new(repositroy: &'a str, token: &'a str) -> Github<'a> {
    Github { 
      repositroy,
      token,
    }
  }

  /// # Build reqwest client with gihub common configure
  /// [github doc](https://docs.github.com/cn/rest/git/)
  pub async fn client(&self, method: Method, url: &str, body: Option<HashMap<&str, &str>>) -> Presult<JsonValue>
  {
    //dotenv()?;
    println!("client begin");

    let client_inner = reqwest::Client::new();
    println!("blocking init");
    let mut auth = String::from("token ");
    auth.push_str(self.token);

    println!("append token");

    let mut full_url = String::from("https://api.github.com/repos/");
    full_url.push_str(self.repositroy);
    full_url.push('/');
    full_url.push_str(url);

    println!("full_url :{}", full_url);

    let mut request = client_inner.request(method, full_url)
      .header("Authorization", auth)
      .header("User-Agent","tu6ge(772364230@qq.com)")
      .header("Accept", "application/vnd.github.v3+json");

    if let Some(body) = body {
      request = request.json(&body)
    }

    let response = request.send().await?;
    
    if response.status() != 200 && response.status() !=201 && response.status() != 204{
      return Err(Perror::Github(response.text().await?));
    }

    if response.status() == 204 {
      return Ok(JsonValue::new_object());
    }

    let result = json::parse(&response.text().await?)?;
    Ok(result)
  }

  /// # Get git sha of git head
  pub async fn get_sha(&self, head: &str) -> Presult<String>{
    println!("get_sha begin");
    let url = String::from("git/matching-refs/heads/") + head;
    let json = self.client(Method::GET, &url, None).await?;
    let sha: String = json[0]["object"]["sha"].to_string();
    Ok(sha)
  }
  
  /// # Set tag ref by git sha
  pub async fn set_ref(&self, tag: &str, sha: &str) -> Presult<()>{
    let url = "git/refs";
    let mut body = HashMap::new();
  
    let mut tag_string = String::from("refs/tags/");
    tag_string.push_str(tag);
    
    body.insert("ref", tag_string.as_str());
    body.insert("sha", sha);
  
    self.client(Method::POST, url, Some(body)).await?;
    Ok(())
  }
  
  /// # delete git ref
  pub async fn del_ref(&self) -> Presult<()>{
    let url = "git/refs/tags/dev-0.2.0";
  
    self.client(Method::DELETE, url, None).await?;
    Ok(())
  }
}



