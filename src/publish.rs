use std::{env, path::PathBuf, process::Command, task::Poll};

use crate::{
    error::{Perror, Presult},
    github, set_output,
};
use cargo::{
    core::{Dependency, Registry, SourceId, Workspace},
    sources::source::QueryKind,
};

pub const CRATES_IO_REGISTRY: &str = "crates-io";

#[derive(Debug)]
pub(crate) enum PublicationStatus {
    NotPublished,
    Published,
}

pub(crate) fn publish(path: Option<String>, tag_prefix: Option<String>) -> Presult<()> {
    let repository = env::var("GITHUB_REPOSITORY")?;
    let branch = env::var("GITHUB_REF_NAME")?;
    let token = env::var("GITHUB_TOKEN")?;
    let mut gh_path = env::var("GITHUB_WORKSPACE")?;
    // let repository = String::from("aaa");
    // let branch = String::from("bbb");
    // let token = String::from("ccc");
    // let mut gh_path = String::from("/app");

    if let Some(path) = path {
        //println!("gh_path += &path");
        gh_path += &path;
    }

    let (name, version, publication_status) = get_publication_status(&gh_path)?;
    println!("repository: {}", repository);
    println!("name: {}, version: {}", name, version);
    println!("publication status: {:?}", publication_status);

    for pub_status in publication_status {
        if matches!(pub_status, PublicationStatus::Published) {
            //println!("::set-output name=new_version::false");
            set_output("new_version=false");
            println!("already published");
            return Ok(());
        }
    }

    //println!("::set-output name=new_version::true");
    set_output("new_version=true");
    println!("version not published");
    let _ = Command::new("rustup")
        .args(["install", "stable"])
        .status()?
        .success();
    let _ = Command::new("rustup")
        .args(["default", "stable"])
        .status()?
        .success();

    let com_res = Command::new("rustup")
        .args(["run", "stable", "cargo", "publish"])
        .current_dir(&gh_path)
        .status()?;
    if !com_res.success() {
        //println!("::set-output name=publish::false");
        set_output("publish=false");
        return Err(Perror::Input("publish command failed".to_string()));
    }

    let gh = github::Github::new(&repository, &token);
    let sha = gh.get_sha(&branch)?;
    println!("sha: {}", sha);

    let mut tag = match tag_prefix {
        Some(p) => p,
        None => "".to_string(),
    };
    tag += &version;

    gh.set_ref(&tag, &sha)?;
    println!("new version tag {} is created", &tag);
    //println!("::set-output name=publish::true");
    set_output("publish=true");

    Ok(())
}

type Name = String;
type Version = String;

fn get_publication_status(
    workspace_root: &str,
) -> Presult<(Name, Version, Vec<PublicationStatus>)> {
    let mut config = cargo::util::Config::default()?;
    //println!("config init");

    config.configure(2, false, None, false, false, false, &None, &[], &[])?;
    let mut cargo_toml = PathBuf::from(workspace_root);
    cargo_toml.push("Cargo.toml");
    // println!(
    //     "workspace_root: {}, cargo_toml {}",
    //     workspace_root,
    //     cargo_toml.display()
    // );
    cargo_toml = cargo_toml.canonicalize()?;
    //println!("canonicalize finished");

    let workspace = Workspace::new(&cargo_toml, &config)?;

    let package = workspace.current()?;
    // Find where to publish
    let publish_registries = package.publish();
    let publish_registries = match publish_registries {
        None => vec![CRATES_IO_REGISTRY.to_string()],
        Some(v) => v.clone(),
    };
    if publish_registries.is_empty() {
        return Err(Perror::PublishingDisabled);
    }
    let _lock = config.acquire_package_cache_lock()?;
    // now - for each publication target, check whether it has this version (or newer)
    let mut statuses = Vec::with_capacity(publish_registries.len());
    for registry in publish_registries {
        let source_id = if registry == CRATES_IO_REGISTRY {
            SourceId::crates_io(&config)?
        } else {
            SourceId::alt_registry(&config, &registry)?
        };
        let mut package_registry = cargo::core::registry::PackageRegistry::new(&config)?;
        package_registry.lock_patches();
        let dep = Dependency::parse(
            package.name(),
            Some(&package.version().to_string()),
            source_id,
        )?;
        let summaries = loop {
            match package_registry.query_vec(&dep, QueryKind::Exact)? {
                Poll::Ready(deps) => break deps,
                Poll::Pending => package_registry.block_until_ready()?,
            }
        };
        let matched = summaries
            .iter()
            .filter(|s| s.version() == package.version())
            .count()
            > 0;
        statuses.push(if matched {
            PublicationStatus::Published
        } else {
            PublicationStatus::NotPublished
        });
    }
    Ok((
        package.name().to_string(),
        package.version().to_string(),
        statuses,
    ))
}
