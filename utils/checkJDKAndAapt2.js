const { existsSync } = require('node:fs');

const exec = require('./promisifiedExec.js');

const { dloadFromURL } = require('./FileDownloader.js');

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function checkJDKAndAapt2(ws) {
  try {
    await exec('java -v');
  } catch (e) {
    if (e.stderr.includes('not found'))
      ws.send(
        JSON.stringify({
          event: 'error',
          error:
            "You don't have JDK installed. Please close ReVanced Builder and install it using: `pkg install openjdk-17`"
        })
      );
  }

  if (!existsSync('revanced/aapt2')) {
    await dloadFromURL(
      'https://github.com/reisxd/revanced-cli-termux/raw/main/aapt2.zip',
      'revanced/aapt2.zip',
      ws
    );
    await exec('unzip revanced/aapt2.zip -d revanced/');

    switch (process.arch) {
      case 'arm64':
        await exec('cp revanced/arm64-v8a/aapt2 revanced/aapt2');
        await exec('chmod +x revanced/aapt2');
        break;
      case 'arm':
        await exec('cp revanced/armeabi-v7a/aapt2 revanced/aapt2');
        await exec('chmod +x revanced/aapt2');
    }

    await exec(
      'rm -rf revanced/arm64-v8a revanced/armeabi-v7a revanced/x86 revanced/aapt2.zip'
    );
  }
};
