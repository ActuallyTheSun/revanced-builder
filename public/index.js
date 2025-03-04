/* eslint-disable no-unused-vars */

const WS_URI = `${window?.location?.protocol === 'https:' ? 'wss' : 'ws'}://${
  window?.location?.host ?? 'localhost:8080'
}`;
const ws = new WebSocket(WS_URI);

let currentFile;
let alreadyAddedLog = false;
let isDownloading = false;
let hasFinished = false;
let arch;
let versionChoosen;

function sendCommand(args) {
  ws.send(JSON.stringify(args));
}

const colorNow = localStorage.getItem('theme') ?? '#4873b3';
document.documentElement.style.setProperty('--accentColor', colorNow);

function setApp() {
  const appChecked = document.querySelector('input[name="app"]:checked');

  if (appChecked === null) return alert("You didn't select an app to patch!");

  sendCommand({
    event: 'selectApp',
    selectedApp: appChecked.value
  });

  location.href = '/dependencies';
}

function loadPatches() {
  sendCommand({ event: 'getPatches' });
}

function updateFiles() {
  sendCommand({ event: 'updateFiles' });
}

/**
 * @param {boolean} bool
 */
function toggle(bool) {
  for (const checkbox of document.getElementsByClassName('select')) {
    if (bool && checkbox.getAttribute('data-excluded') !== '0') continue;

    checkbox.checked = bool;
  }
}

function goToPatches() {
  if (hasFinished) location.href = '/patches';
}

function checkForUpdates() {
  sendCommand({ event: 'checkForUpdates' });
}

function setPatches() {
  const patchElementList = Array.from(document.querySelectorAll('.select'));

  let selectedPatchList = [];
  let excludedPatchList = [];

  for (const patchElement of patchElementList)
    (patchElement.checked ? selectedPatchList : excludedPatchList).push(
      patchElement
    );

  if (selectedPatchList.length === 0)
    return alert("You haven't selected any patches.");

  selectedPatchList = selectedPatchList.map((x) =>
    x.getAttribute('data-patch-name')
  );
  excludedPatchList = excludedPatchList.map((x) =>
    x.getAttribute('data-patch-name')
  );

  if (selectedPatchList.includes('enable-debugging')) {
    const confirmDebug = confirm(
      '**Included the "Enable Debugging" Patch**\n***Are you sure?***\nBecause this patch will slow down your app and it\'s only for debugging purposes.'
    );

    if (!confirmDebug) return;
  }

  sendCommand({
    event: 'selectPatches',
    selectedPatches: selectedPatchList,
    excludedPatches: excludedPatchList
  });

  location.href = '/versions';
}

/**
 * @param {string} arch
 * @param {string} version
 */
function setAppVersion(arch, version) {
  if (!isDownloading) {
    const versionChecked = document.querySelector(
      'input[name="version"]:checked'
    );

    if (arch == null && versionChecked === null)
      return alert("You didn't select an app version!");

    if (versionChecked !== null) {
      if (versionChecked.getAttribute('data-recommended') !== '1') {
        const alertVersion = confirm(
          "**Non-recommended version selected**\n***Are you sure?***\nThis version isn't recommended, do you really want to use this version?"
        );

        if (!alertVersion) return;
      }

      if (versionChecked.getAttribute('data-beta') !== '0') {
        const alertBetaVersion = confirm(
          '**Beta version selected**\n***Are you sure?***\nThis version is beta and it might have issues, do you really want to use this version?'
        );

        if (!alertBetaVersion) return;
      }
    }

    document.getElementById('continue').classList.add('disabled');

    sendCommand({
      event: 'selectAppVersion',
      versionChoosen: version ?? versionChecked.value,
      arch
    });

    document.getElementsByTagName('header')[0].innerHTML =
      '<h1>Downloading APK...</h1>';
    document.getElementById('content').innerHTML = '<span class="log"></span>';
    document.getElementsByTagName('main')[0].innerHTML +=
      '<progress value="0"></progress>';
    isDownloading = true;
  } else {
    if (!hasFinished) return alert("Downloading process hasn't finished yet.");

    location.href = '/patch';
  }
}

/**
 * @param {boolean} isRooted
 */
function getAppVersions(isRooted) {
  document.getElementsByTagName('header')[0].innerHTML = `
    <h1>Select the version you want to download</h1>
    <span>Versions marked as beta might have bugs or can be unstable, unless marked as recommended<span>
    ${
      isRooted
        ? "<span><strong>You are building rooted ReVanced</strong>, you'll need to download the version matching with your YouTube version.<br>(You'll also need YouTube installed)<br>If you didn't intend on doing a rooted build, include all \"Root required to exclude\" patches<span>"
        : ''
    }
    `;

  const continueButton = document.getElementById('continue');
  const backButton = document.getElementById('back');

  continueButton.innerHTML = 'Continue';
  continueButton.onclick = () => setAppVersion();
  backButton.innerHTML = 'Back';
  backButton.onclick = () => history.back();

  sendCommand({ event: 'getAppVersion' });
}

function buildReVanced() {
  sendCommand({ event: 'patchApp' });
}

function getAlreadyExists() {
  sendCommand({ event: 'checkFileAlreadyExists' });
}

function openAbout() {
  window.open('/about', '_blank');
}

function openGitHub() {
  window.open('https://github.com/reisxd/revanced-builder', '_blank');
}

function openColorPicker() {
  document.querySelector('.theming').classList.toggle('show');
}

/**
 * @param {string} phrase
 */
function toTitleCase(phrase) {
  return phrase
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function exitApp() {
  location.href = '/exited';
}

window.addEventListener('keypress', (e) => {
  if (e.key !== 'Enter') return;

  e.preventDefault();

  document.getElementById('continue').click();
});

function setDevice() {
  const deviceChecked = document.querySelector('input[name="device"]:checked');

  if (deviceChecked === null) return alert("You didn't select an device!");

  sendCommand({
    event: 'setDevice',
    deviceId: deviceChecked.value
  });

  location.href = '/patches';
}

function getDevices() {
  sendCommand({ event: 'getDevices' });
}

ws.onmessage = (msg) => {
  /** @type {Record<string, any>} */
  const message = JSON.parse(msg.data);

  switch (message.event) {
    case 'patchList':
      {
        const len = message.patchList.length;

        const patchListElement = document.getElementById('patchList');

        for (let i = 0; i < len; i++) {
          const patch = message.patchList[i];

          patchListElement.innerHTML += `<li>
  <input class="select" id="select-patch-${i}" data-patch-name="${
            patch.name
          }" data-excluded="${patch.excluded ? '1' : '0'}" type="checkbox">
  <label for="select-patch-${i}">
    <span style="float:right;"><strong>${
      patch.isRooted ? 'Needed for Non-Root Building' : ''
    }</strong></span>
    <span><strong>${toTitleCase(patch.name)}</strong>&nbsp;&nbsp;(${
            patch.maxVersion !== ' ' ? patch.maxVersion : 'ALL'
          })</span>
    <span class="patch-description">${patch.description}</span>
  </label>
</li>`;
        }

        for (const patch of document.getElementsByClassName('select'))
          if (
            message.rememberedPatchList.includes(
              patch.getAttribute('data-patch-name')
            )
          )
            patch.checked = true;
      }
      break;
    case 'downloadingFile':
      {
        isDownloading = true;

        let logElement = document.getElementsByClassName('log')[0];

        if (!logElement) {
          document.getElementById('content').innerHTML =
            '<span class="log"></span>';
          document.getElementsByTagName('main')[0].innerHTML +=
            '<progress value="0"></progress>';
          logElement = document.getElementsByClassName('log')[0];
        }

        const downloadMessage = `<span class="log-line"><strong>[builder]</strong> Downloading ${message.name}...</span><br/>`;

        if (currentFile !== message.name) {
          currentFile = message.name;
          logElement.innerHTML += downloadMessage;
        }

        document.getElementsByTagName('progress')[0].value = (
          message.percentage / 100
        ).toString();
      }
      break;
    case 'finished':
      hasFinished = true;

      document.getElementById('continue').classList.remove('disabled');
      document.getElementsByClassName('log')[0].innerHTML +=
        '<span class="log-line"><strong>[builder]</strong> Finished downloading files.</span><br/>';
      break;
    case 'appVersions':
      {
        const len = message.versionList.length;

        const versionsElement = document.getElementById('versions');

        for (let i = 0; i < len; i++) {
          const version = message.versionList[i];

          versionsElement.innerHTML += `
            <li>
            <input type="radio" name="version" id="app-${i}" value="${
            version.version
          }" data-beta="${version.beta ? '1' : '0'}" data-recommended="${
            version.recommended ? '1' : '0'
          }"/>
            <label for="app-${i}">${version.version} ${
            version.beta ? ' (beta)' : ''
          } ${version.recommended ? ' (recommended)' : ''}</label></li>`;
        }

        if (message.selectedApp === 'music' && !message.foundDevice)
          document.getElementById('continue').onclick = () => {
            const version = document.querySelector(
              'input[name="version"]:checked'
            ).value;

            document.getElementsByTagName('header')[0].innerHTML = `
          <h1>Please select the architecture</h1>
          <span>YouTube Music APKs only have specific architecture APKs.
          <br>If you don't know which one to choose, either look at your devices architecture using CPU-Z or select Arm64.</span>`;
            document.getElementById('versions').innerHTML = `
          <li>
          <input type="radio" name="arch" id="arch-1" value="arm64-v8a"/>
          <label for="arch-1">Arm64 (armv8)</label></li>
          <li>
          <input type="radio" name="arch" id="arch-2" value="armeabi-v7a"/>
          <label for="arch-2">Arm32 (armv7)</label></li>`;
            document.getElementById('continue').onclick = () => {
              if (isDownloading && hasFinished) location.href = '/patch';

              document.getElementById('continue').classList.add('disabled');

              setAppVersion(
                document.querySelector('input[name="arch"]:checked').value,
                version
              );
            };
          };
      }
      break;
    case 'patchLog':
      {
        const logLevel = message.log.includes('WARNING')
          ? 'warn'
          : message.log.includes('SEVERE')
          ? 'error'
          : 'info';

        document.getElementsByClassName(
          'log'
        )[0].innerHTML += `<span class="log-line ${logLevel}"><strong>[builder]</strong> ${message.log}</span><br>`;

        const logWrap = document.getElementById('content--wrapper');
        logWrap.scrollTop = logWrap.scrollHeight;
      }
      break;
    case 'fileExists':
      {
        // TODO: on a root install, if the file already exists and the user selects yes it skips checking if a device is plugged in
        document.getElementsByTagName('header')[0].innerHTML = `
            <h1>Use already downloaded APK?</h1>
            <span>The APK already exists in the revanced folder.${
              message.isRooted ? ' ' : '<br>'
            }Do you want to use it?${
          message.isRooted
            ? '<br>(Saying no is recommended for rooted building)<br>If you didn\'t intend on doing a rooted build, include all "Root required to exclude" patches'
            : ''
        }</span>`;

        const continueButton = document.getElementById('continue');
        const backButton = document.getElementById('back');

        continueButton.innerHTML = 'Yes';
        continueButton.onclick = () => {
          location.href = '/patch';
        };
        backButton.innerHTML = 'No';
        backButton.onclick = () => getAppVersions(message.isRooted);
      }
      break;
    case 'fileDoesntExist':
      getAppVersions(message.isRooted);
      break;
    case 'buildFinished':
      {
        document.getElementsByTagName('header')[0].innerHTML =
          '<h1>ReVanced has been built.</h1>';

        const firstFooterElement = document.getElementsByTagName('footer')[0];

        if (!WS_URI.startsWith('ws://localhost'))
          firstFooterElement.innerHTML +=
            '<button class="highlighted" onclick="window.open(\'/revanced.apk\', \'_blank\')">Download</button>';

        document.getElementsByTagName('footer')[0].innerHTML +=
          '<button class="highlighted" onclick="location.href = \'/\'">Build Again</button><button onclick="exitApp();">Quit</button>';
      }
      break;
    case 'error':
      location.href = `/failure?error=${message.error}`;
      break;
    case 'notUpToDate':
      document.getElementById('container').innerHTML += `
      <dialog>
      <span>Your current version of Builder is not up to date.<br>Do you want to update to ${message.builderVersion}?</span>
      <div class="buttonContainer"><button class="highlighted" onclick="window.open('https://github.com/reisxd/revanced-builder/releases/latest', '_blank'); document.getElementById('container').removeChild(document.getElementsByTagName('dialog')[0]);">Yes</button> <button onclick="document.getElementById('container').removeChild(document.getElementsByTagName('dialog')[0]);">No</button></div></dialog>`;
      break;
    case 'multipleDevices':
      location.href = '/devices';
      break;
    case 'devices': {
      const len = message.devices.length;

      for (let i = 0; i < len; i++) {
        const device = message.devices[i];

        document.getElementById('devices').innerHTML += `
            <li>
            <input type="radio" name="device" id="app-${i}" value="${device.id}"/>
            <label for="app-${i}">${device.id} (${device.model})</label></li>`;
      }
    }
  }
};
