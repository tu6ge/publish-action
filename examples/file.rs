use std::{fs, io::Write};

pub fn main() {
    let mut file = fs::File::options()
        .append(true)
        .write(true)
        .open("a.txt")
        .unwrap();
    file.write_all("111\n".as_bytes()).expect("write faild");
    file.write_all("222\n".as_bytes()).expect("write faild");
}
