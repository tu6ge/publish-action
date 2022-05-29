//extern crate openssl;

use std::io::Read;
use crates_io_api::{SyncClient, Error};
use cargo_toml::Manifest;
use version_compare::{Cmp, compare_to};
use std::process::Command;
use dotenv::dotenv;
use std::{env};
use crate::error::{Perror,Presult};

mod github;
mod error;

fn main() {
    //list_top_dependencies();
    
    dotenv().ok();

    let repositroy = env::var("GITHUB_REPOSITORY").unwrap();
    let branch = env::var("GITHUB_REF_NAME").unwrap();
    let token = env::var("GITHUB_TOKEN").unwrap();

    println!("repositroy: {}", repositroy);

    let gh = github::Github::new(&repositroy, &token);
    let sha =  gh.get_sha(&branch);
    //let res = github.del_ref();
    println!("sha: {:?}", sha);

    let (name,version) = get_new_info().unwrap();
    println!("name: {}, version: {}", name, version);

    let published_version = get_published_version(&version).unwrap();

    println!("name: {}, published version: {}, version: {}", name, published_version, version);

    // let published_version = get_published_version().unwrap();
    // let new_version = get_new_version().unwrap();

    // if compare_to(new_version, published_version, Cmp::Gt).unwrap() {
    //     println!("新版本比较大");
    //     let output = Command::new("git").arg("help").output().expect("git exec error!");
    //     let output_str = String::from_utf8_lossy(&output.stdout);
    //     println!("command res:{}", output_str)
    // }
}


fn get_published_version(name: &str) -> Presult<String> {
    let client = SyncClient::new(
         "tu6ge (772364230@qq.com)",
         std::time::Duration::from_millis(1000),
    )?;
    let summary = client.get_crate(name)?;
    Ok(summary.crate_data.max_version)
}

fn get_new_info() -> Presult<(String,String)> {
    let mut content: Vec<u8> = Vec::new();
    let mut path = env::var("GITHUB_WORKSPACE")?;
    path.push_str("/Cargo.toml");

    println!("path {}", path);

    std::fs::File::open(path)?.read_to_end(&mut content)?;

    let info = Manifest::from_slice(&content)?;

    match info.package {
        Some(v) => Ok((v.name,v.version)),
        None => Err(Perror::Input("not found version in Cargo.toml".to_string()))
    }
}