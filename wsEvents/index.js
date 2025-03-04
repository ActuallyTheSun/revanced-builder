const patchApp = require('./patchApp.js');
const selectApp = require('./selectApp.js');
const selectAppVersion = require('./selectAppVersion.js');
const selectPatches = require('./selectPatches.js');
const updateFiles = require('./updateFiles.js');
const getPatches = require('./getPatches.js');
const getAppVersion = require('./getAppVersion.js');
const checkFileAlreadyExists = require('./checkFileAlreadyExists.js');
const checkForUpdates = require('./checkForUpdates.js');
const getDevices = require('./getDevices.js');
const setDevice = require('./setDevice.js');

module.exports = {
  patchApp,
  selectApp,
  selectAppVersion,
  selectPatches,
  updateFiles,
  getPatches,
  getAppVersion,
  checkFileAlreadyExists,
  checkForUpdates,
  getDevices,
  setDevice
};
