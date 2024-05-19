//extern crate openssl;

use std::collections::HashSet;
use std::env;
use std::fs::read_to_string;

use serde::{Deserialize, Serialize};

use crate::error::Presult;

#[cfg(test)]
use dotenv::dotenv;
use publish::publish;

mod error;
mod github;
mod publish;

fn main() -> Presult<()> {
    //list_top_dependencies();

    #[cfg(test)]
    dotenv().ok();

    let config_str = read_to_string("./.github/publish.yml")?;
    let config: ProjectList = serde_yaml::from_str(&config_str).unwrap();

    println!("{:?}", config);

    if !config.check_same_error() {
        panic!("this config have repeat projectes");
    }

    for item in config.projects.into_iter() {
        publish(item.dir, item.tag_prefix)?;
    }

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
struct Project {
    name: String,
    dir: Option<String>,
    tag_prefix: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ProjectList {
    projects: Vec<Project>,
}

impl ProjectList {
    fn check_same_error(&self) -> bool {
        let mut dirs = HashSet::new();
        let mut prefixes = HashSet::new();
        let mut default_dir_total = 0_u8;
        let mut default_prefix_total = 0_u8;
        for it in self.projects.iter() {
            if let Some(path) = it.dir.clone() {
                dirs.insert(path);
            } else {
                default_dir_total += 1;
            }
            if let Some(p) = it.tag_prefix.clone() {
                prefixes.insert(p);
            } else {
                default_prefix_total += 1;
            }
        }

        if default_dir_total > 1 {
            return false;
        }
        if default_prefix_total > 1 {
            return false;
        }
        if dirs.len() + (default_dir_total as usize) < self.projects.len() {
            return false;
        }
        if prefixes.len() + (default_prefix_total as usize) < self.projects.len() {
            return false;
        }

        true
    }
}

fn set_output(info: &'static str) {
    use std::fs;
    use std::io::Write;

    let path = env::var("GITHUB_OUTPUT").expect("no found GITHUB_OUTPUT environment");
    let mut file = fs::File::options()
        .append(true)
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
