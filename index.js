const core = require('@actions/core');
//const github = require('@actions/github');
const {spawn} = require('child_process');

try {
  const dir = core.getInput("dir");
  const tag_prefix = core.getInput("tag_prefix");
  // const dir = "/";
  // const tag_prefix = "";
  //let path = process.env.GITHUB_WORKSPACE;
  
  const publish = spawn(`publish-action`, ['-d', dir, '-t', tag_prefix], {
    //cwd: path,
  });

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