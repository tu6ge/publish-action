use std::{fs, io::Write};

pub fn main() {
    let mut file = fs::File::options()
        .append(true)
        .write(true)
        .open("a.txt")
        .unwrap();
    file.write("111\n".as_bytes()).expect("write faild");
    file.write("222\n".as_bytes()).expect("write faild");
}
