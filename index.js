const core = require('@actions/core');
const {spawn} = require('child_process');

try {
  const dir = core.getInput("dir");
  const tag_prefix = core.getInput("tag_prefix");
  // const dir = "/";
  // const tag_prefix = "";
  const publish = spawn(`cargo`, ['run', '-r', '--', 
    '-d', dir, '-t', tag_prefix,
  ]);

  publish.stdout.on('data', (data)=> {
    //console.log(data.toString());
    core.setOutput(data.toString())
  })
  publish.stderr.on('data', (data)=> {
    //console.error(data.toString());
    core.setOutput(data.toString())
  });

} catch(e) {
  //console.error("eeeeeee", e.message);
  core.setFailed(e.message);
}