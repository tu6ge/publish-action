//extern crate openssl;

use std::io::Read;
use crates_io_api::{SyncClient};
use cargo_toml::Manifest;
use version_compare::{Cmp, compare_to};
use std::process::Command;
use dotenv::dotenv;
use std::{env};
use crate::error::{Perror,Presult};

mod github;
mod error;

fn main() -> Presult<()> {
    //list_top_dependencies();
    
    dotenv().ok();

    let repositroy = env::var("GITHUB_REPOSITORY")?;
    let branch = env::var("GITHUB_REF_NAME")?;
    let token = env::var("GITHUB_TOKEN")?;
    let path = env::var("GITHUB_WORKSPACE")?;

    println!("repositroy: {}", repositroy);

    let (name,version) = get_new_info(&path)?;
    println!("name: {}, version: {}", name, version);

    let published_version = get_published_version(&name)?;
    println!("published version: {}", published_version);

    if compare_to(&version, &published_version, Cmp::Gt).unwrap() == false {
        println!("not find new version");
        println!("::set-output name=new_version::false");
        return Ok(());
    }

    println!("::set-output name=new_version::true");
    println!("find new version");
    

    let com_res = Command::new("cargo").arg("publish")
        .current_dir(&path)
        .status()?;
    if com_res.success()==false {
        println!("::set-output name=publish::false");
        return Err(Perror::Input("publish command failed".to_string()));
    }
    
    let gh = github::Github::new(&repositroy, &token);
    let sha =  gh.get_sha(&branch)?;
    println!("sha: {}", sha);

    gh.set_ref(&version, &sha)?;
    println!("new version {} is created", &version);
    println!("::set-output name=publish::true");

    Ok(())
}


fn get_published_version(name: &str) -> Presult<String> {
    let client = SyncClient::new(
         "tu6ge (772364230@qq.com)",
         std::time::Duration::from_millis(1000),
    )?;
    let summary = client.get_crate(name)?;
    Ok(summary.crate_data.max_version)
}

fn get_new_info(path: &str) -> Presult<(String,String)> {
    let mut content: Vec<u8> = Vec::new();
    let mut path = String::from(path);
    path.push_str("/Cargo.toml");

    //println!("path {}", path);

    std::fs::File::open(path)?.read_to_end(&mut content)?;

    let info = Manifest::from_slice(&content)?;

    match info.package {
        Some(v) => Ok((v.name,v.version)),
        None => Err(Perror::Input("not found version in Cargo.toml".to_string()))
    }
}