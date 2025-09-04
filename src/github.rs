//! # Github API SDK

use std::collections::HashMap;

use crate::error::{Perror, Presult};
use reqwest::{blocking, Method};
use serde_json::Value as JsonValue;

pub struct Github<'a> {
    repositroy: &'a str,
    token: &'a str,
    ua_value: Option<String>,
}

impl<'a> Github<'a> {
    pub fn new(repositroy: &'a str, token: &'a str) -> Github<'a> {
        Github {
            repositroy,
            token,
            ua_value: None,
        }
    }

    pub fn set_ua(mut self, value: Option<String>) -> Self {
        self.ua_value = value;
        self
    }

    /// # Build reqwest client with gihub common configure
    /// [github doc](https://docs.github.com/cn/rest/git/)
    pub fn client(
        &self,
        method: Method,
        url: &str,
        body: Option<HashMap<&str, &str>>,
    ) -> Presult<JsonValue> {
        //dotenv()?;
        const AUTHORIZATION: &str = "Authorization";
        const UA: &str = "User-Agent";
        const UA_VALUE: &str = "tu6ge(772364230@qq.com)";
        const ACCEPT: &str = "Accept";
        const ACCEPT_VALUE: &str = "application/vnd.github.v3+json";

        let client_inner = blocking::Client::builder().build()?;

        let full_url = format!("https://api.github.com/repos/{}/{}", self.repositroy, url);

        let mut request = client_inner
            .request(method, full_url)
            .header(AUTHORIZATION, format!("token {}", self.token))
            .header(UA, self.ua_value.clone().unwrap_or(UA_VALUE.to_string()))
            .header(ACCEPT, ACCEPT_VALUE);

        if let Some(body) = body {
            request = request.json(&body)
        }

        let response = request.send()?;

        if !response.status().is_success() {
            return Err(Perror::Github(response.text()?));
        }

        if response.status() == 204 {
            return Ok(JsonValue::Null);
        }

        Ok(serde_json::from_str(&response.text()?)?)
    }

    /// # Get git sha of git head
    pub fn get_sha(&self, head: &str) -> Presult<String> {
        const HEAD_PATH: &str = "git/matching-refs/heads/";
        let url = String::from(HEAD_PATH) + head;
        let json = self.client(Method::GET, &url, None)?;
        let value = &json[0]["object"]["sha"];
        if matches!(value, JsonValue::Null) {
            return Err(Perror::GetTagFailed);
        }
        let sha = value.as_str().ok_or(Perror::GetTagFailed)?.to_string();
        Ok(sha)
    }

    /// # Set tag ref by git sha
    pub fn set_ref(&self, tag: &str, sha: &str) -> Presult<()> {
        const REF: &str = "ref";
        const SHA: &str = "sha";
        const REF_TAGS: &str = "refs/tags/";
        const PATH: &str = "git/refs";
        let mut body = HashMap::new();

        let mut tag_string = String::from(REF_TAGS);
        tag_string.push_str(tag);

        body.insert(REF, tag_string.as_str());
        body.insert(SHA, sha);

        self.client(Method::POST, PATH, Some(body))?;
        Ok(())
    }

    #[allow(dead_code)]
    /// # delete git ref
    pub fn del_ref(&self) -> Presult<()> {
        const PATH: &str = "git/refs/tags/dev-0.2.0";

        self.client(Method::DELETE, PATH, None)?;
        Ok(())
    }
}

// #[cfg(test)]
// mod tests {
//     use super::Github;

//     #[test]
//     fn set_ref() {
//         let github = Github::new("tu6ge/oss-rs", "");

//         let res = github.set_ref("test-tagss", "xxx");
//     }
// }
