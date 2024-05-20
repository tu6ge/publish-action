const core = require('@actions/core');
const { exec } = require('child_process');

try {
  const dir = core.getInput("dir");
  const tag_prefix = core.getInput("tag_prefix");
  exec(`publish-action`, ['-d', dir, '-t', tag_prefix], (error, stdout, stderr) => {
    core.setOutput(stdout);
    core.setFailed(stderr);

  });

  // publish.stdout.on('data', (data)=> {
  //   core.setOutput(data);
  // })
  // publish.stderr.on('data', (data)=> {
  //   core.console.error(data);
  //   core.console.error(data.data);
  //   core.setFailed(data);
  // });

} catch(e) {
  core.setFailed(e.message);
}