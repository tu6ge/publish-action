const core = require('@actions/core');
const { spawn } = require('child_process');

try {
  const dir = core.getInput("dir");
  const tag_prefix = core.getInput("tag_prefix");
  const publish = spawn('publish-action', ['-d', dir, '-t', tag_prefix]);

  publish.stdout.on('data', (data)=> {
    core.setOutput(data);
  })
  publish.stderr.on('data', (data)=> {
    core.console.error(data);
    core.console.error(data.data);
    core.setFailed(data);
  });

} catch(e) {
  core.setFailed(e.message);
}