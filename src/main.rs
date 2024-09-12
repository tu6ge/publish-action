//extern crate openssl;

use std::env;

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

    let dir = env::var("INPUT_DIR")?;
    let tag_prefix = env::var("INPUT_TAG_PREFIX")?;
    // let dir = "/".to_string();
    // let tag_prefix = "".to_string();

    publish(Some(dir), Some(tag_prefix))?;

    Ok(())
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
