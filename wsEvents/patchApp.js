const { spawn } = require('node:child_process');
const { version } = require('node:os');
const { rmSync, renameSync } = require('node:fs');
const { join } = require('node:path');

const exec = require('../utils/promisifiedExec.js');

const mountReVanced = require('../utils/mountReVanced.js');
const getAppVersion = require('../utils/getAppVersion.js');
const { getDownloadLink } = require('../utils/FileDownloader.js');

/**
 * @param {import('ws').WebSocket} ws
 */
async function mount(ws) {
  let pkg;

  switch (global.jarNames.selectedApp) {
    case 'youtube':
      pkg = 'com.google.android.youtube';
      break;
    case 'music':
      pkg = 'com.google.android.apps.youtube.music';
  }

  ws.send(
    JSON.stringify({
      event: 'patchLog',
      log: 'Trying to mount ReVanced...'
    })
  );

  await mountReVanced(pkg, ws);
}

/**
 * @param {import('ws').WebSocket} ws
 */
async function afterBuild(ws) {
  rmSync('revanced-cache', { recursive: true, force: true });
  outputName();
  renameSync(
    join('revanced', 'revanced.apk'),
    join('revanced', global.outputName)
  );

  if (!global.jarNames.isRooted && process.platform === 'android') {
    await exec(
      `cp revanced/${global.outputName} /storage/emulated/0/${global.outputName}`
    );
    await exec(`cp ${global.jarNames.microG} /storage/emulated/0/microg.apk`);

    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: `Copied files over to /storage/emulated/0/!\nPlease install ReVanced, its located in /storage/emulated/0/${global.outputName}\nand if you are building YT/YTM ReVanced without root, also install /storage/emulated/0/microg.apk.`
      })
    );
  } else if (process.platform === 'android') await mount(ws);
  else if (!global.jarNames.deviceID)
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: `ReVanced has been built!\nPlease transfer over revanced/${global.outputName} and if you are using YT/YTM, revanced/microg.apk and install them!`
      })
    );
  else if (
      !global.jarNames.isRooted &&
      global.jarNames.deviceID &&
      (
        global.jarNames.selectedApp === 'youtube' ||
        global.jarNames.selectedApp === 'music'
      )
  ) {
    const microGVersion = await getAppVersion(
      'com.mgoogle.android.gms',
      null,
      false
    );
    const currentMicroGVersion = (
      await getDownloadLink({ owner: 'TeamVanced', repo: 'VancedMicroG' })
    ).version
      .replace('v', '')
      .split('-')[0];

    if (!microGVersion) {
      await exec(
        `adb -s ${global.jarNames.deviceID} install ${global.jarNames.microG}`
      );

      ws.send(
        JSON.stringify({
          event: 'patchLog',
          log: 'MicroG has been installed.'
        })
      );
    } else if (microGVersion !== currentMicroGVersion) {
      await exec(
        `adb -s ${global.jarNames.deviceID} install ${global.jarNames.microG}`
      );

      ws.send(
        JSON.stringify({
          event: 'patchLog',
          log: 'MicroG has been updated.'
        })
      );
    } else
      ws.send(
        JSON.stringify({
          event: 'patchLog',
          log: 'MicroG is already up to date.'
        })
      );
  }

  ws.send(JSON.stringify({ event: 'buildFinished' }));
}

async function reinstallReVanced() {
  let pkgNameToGetUninstalled;

  switch (global.jarNames.selectedApp) {
    case 'youtube':
      if (!global.jarNames.isRooted)
        pkgNameToGetUninstalled = 'app.revanced.android.youtube';
      break;
    case 'music':
      if (!global.jarNames.isRooted)
        pkgNameToGetUninstalled = 'app.revanced.android.apps.youtube.music';
      break;
    case 'android':
      pkgNameToGetUninstalled = 'com.twitter.android';
      break;
    case 'frontpage':
      pkgNameToGetUninstalled = 'com.reddit.frontpage';
      break;
    case 'warnapp':
      pkgNameToGetUninstalled = 'de.dwd.warnapp';
      break;
    case 'trill':
      pkgNameToGetUninstalled = 'com.ss.android.ugc.trill';
  }

  await exec(
    `adb -s ${global.jarNames.deviceID} uninstall ${pkgNameToGetUninstalled}`
  );
  await exec(
    `adb -s ${global.jarNames.deviceID} install revanced/${global.outputName}`
  );
}

function outputName() {
  const part1 = 'ReVanced';
  let part2;

  switch (global.jarNames.selectedApp) {
    case 'youtube':
      part2 = 'YouTube';
      break;
    case 'music':
      part2 = 'YouTube_Music';
      break;
    case 'frontpage':
      part2 = 'Reddit';
      break;
    case 'android':
      part2 = 'Twitter';
      break;
    case 'warnapp':
      part2 = 'WarnWetter';
  }

  // TODO: If the existing input APK is used from revanced/ without downloading, version and arch aren't set
  const part3 = global?.apkInfo?.version ? `v${global.apkInfo.version}` : '';
  const part4 = global?.apkInfo?.arch;
  const part5 = `cli_${global.jarNames.cli
    .split('/')[2]
    .replace('revanced-cli-', '')
    .replace('.jar', '')}`;
  const part6 = `patches_${global.jarNames.patchesJar
    .split('/')[2]
    .replace('revanced-patches-', '')
    .replace('.jar', '')}`;

  // Filename: ReVanced-<AppName>-<AppVersion>-[Arch]-cli_<CLI_Version>-patches_<PatchesVersion>.apk
  let outputName = '';

  for (const part of [part1, part2, part3, part4, part5, part6])
    if (part) outputName += `-${part}`;

  outputName += '.apk';

  global.outputName = outputName.substring(1);
}

/**
 * @param {string[]} args
 * @param {import('ws').WebSocket} ws
 */
function reportSys(args, ws) {
  ws.send(
    JSON.stringify({
      event: 'error',
      error:
        'An error occured while starting the patching process. Please see the server console.'
    })
  );

  console.log(
    '[builder] Please report these informations to https://github.com/reisxd/revanced-builder/issues'
  );
  console.log(
    `OS: ${process.platform}\nArguements: ${args.join(
      ', '
    )}\n OS Version${version()}`
  );
}

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function patchApp(ws) {
  /** @type {string[]} */
  const args = [
    '-jar',
    global.jarNames.cli,
    '-b',
    global.jarNames.patchesJar,
    '-t',
    './revanced-cache',
    '--experimental',
    '-a',
    `./revanced/${global.jarNames.selectedApp}.apk`,
    '-o',
    './revanced/revanced.apk'
  ];

  if (process.platform === 'android') {
    args.push('--custom-aapt2-binary');
    args.push('revanced/aapt2');
  }

  if (global.jarNames.selectedApp === 'youtube') {
    args.push('-m');
    args.push(global.jarNames.integrations);
  }

  if (global.jarNames.deviceID) {
    args.push('-d');
    args.push(global.jarNames.deviceID);
  }

  args.push(...global.jarNames.patches.split(' '));

  if (
    global.jarNames.selectedApp.endsWith('frontpage') ||
    global.jarNames.selectedApp.endsWith('trill')
  )
    args.push('-r');

  if (global.jarNames.isRooted && global.jarNames.deviceID)
    args.push('--mount');

  const buildProcess = spawn('java', args);

  buildProcess.stdout.on('data', async (data) => {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: data.toString()
      })
    );

    if (data.toString().includes('Finished')) await afterBuild(ws);

    if (data.toString().includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
      await reinstallReVanced(ws);
      await afterBuild(ws);
    }

    if (data.toString().includes('Unmatched')) reportSys(args, ws);
  });

  buildProcess.stderr.on('data', async (data) => {
    ws.send(
      JSON.stringify({
        event: 'patchLog',
        log: data.toString()
      })
    );

    if (data.toString().includes('Finished')) await afterBuild(ws);

    if (data.toString().includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) {
      await reinstallReVanced(ws);
      await afterBuild(ws);
    }

    if (data.toString().includes('Unmatched')) reportSys(args, ws);
  });
};
