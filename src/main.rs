//extern crate openssl;

use std::{env, path::PathBuf};
use std::{process::Command, task::Poll};

use crate::error::{Perror, Presult};
use cargo::{core::{Dependency, Registry, SourceId, Workspace}, sources::source::QueryKind};
#[cfg(test)]
use dotenv::dotenv;

mod error;
mod github;

pub const CRATES_IO_REGISTRY: &str = "crates-io";

#[derive(Debug)]
enum PublicationStatus {
    NotPublished,
    Published,
}

fn main() -> Presult<()> {
    //list_top_dependencies();

    #[cfg(test)]
    dotenv().ok();

    let repository = env::var("GITHUB_REPOSITORY")?;
    let branch = env::var("GITHUB_REF_NAME")?;
    let token = env::var("GITHUB_TOKEN")?;
    let path = env::var("GITHUB_WORKSPACE")?;

    let (name, version, publication_status) = get_publication_status(&path)?;
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

    let com_res = Command::new("cargo")
        .arg("publish")
        .current_dir(&path)
        .status()?;
    if !com_res.success() {
        //println!("::set-output name=publish::false");
        set_output("publish=false");
        return Err(Perror::Input("publish command failed".to_string()));
    }

    let gh = github::Github::new(&repository, &token);
    let sha = gh.get_sha(&branch)?;
    println!("sha: {}", sha);

    gh.set_ref(&version, &sha)?;
    println!("new version {} is created", &version);
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

    config.configure(2, false, None, false, false, false, &None, &[], &[])?;
    let mut cargo_toml = PathBuf::from(workspace_root);
    cargo_toml.push("Cargo.toml");
    cargo_toml = cargo_toml.canonicalize()?;
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

fn set_output(info: &'static str) {
    use std::fs;
    use std::io::Write;

    let path = env::var("GITHUB_OUTPUT").expect("no found GITHUB_OUTPUT environment");
    let mut file = fs::File::options()
        .append(true)
        .write(true)
        .open(path)
        .expect("open GITHUB_OUTPUT file failed");
    file.write_all(info.as_bytes())
        .expect("write output content faild");
    file.write_all(b"\n").expect("write output \n faild");
}

#[cfg(test)]
mod tests {
    use std::{env, io::Read};

    use crate::set_output;

    #[test]
    fn test_set_output() {
        let mut tmpfile = tempfile::NamedTempFile::new().unwrap();

        let path = tmpfile.path();
        env::set_var("GITHUB_OUTPUT", path);
        set_output("111=222");
        set_output("333=444");

        let mut content = String::new();
        tmpfile.read_to_string(&mut content).unwrap();

        assert_eq!(content, "111=222\n333=444\n");
    }
}
