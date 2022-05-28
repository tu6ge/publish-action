use std::io::Read;

use crates_io_api::{SyncClient, Error};
use cargo_toml::Manifest;
use version_compare::{Cmp, compare_to};
use std::process::Command;


mod github;
mod error;

fn main() {
    //list_top_dependencies();

    let res = github::client();

    println!("{:?}", res);

    // let published_version = get_published_version().unwrap();
    // let new_version = get_new_version().unwrap();

    // if compare_to(new_version, published_version, Cmp::Gt).unwrap() {
    //     println!("新版本比较大");
    //     let output = Command::new("git").arg("help").output().expect("git exec error!");
    //     let output_str = String::from_utf8_lossy(&output.stdout);
    //     println!("command res:{}", output_str)
    // }
}


fn get_published_version() -> Result<String, Error> {
    // Instantiate the client.
    let client = SyncClient::new(
         "tu6ge (772364230@qq.com)",
         std::time::Duration::from_millis(1000),
    ).unwrap();
    // Retrieve summary data.
    let summary = client.get_crate("aliyun-oss-client")?;
    Ok(summary.crate_data.max_version)
}

fn get_new_version() -> Option<String> {
    let mut content: Vec<u8> = Vec::new();
    std::fs::File::open("../oss/Cargo.toml")
      .expect("open file failed").read_to_end(&mut content)
      .expect("read_to_end failed");

    let info = Manifest::from_slice(&content).expect("get version failed");

    match info.package {
        Some(v) => Some(v.version),
        None => None
    }
}