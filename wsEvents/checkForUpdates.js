const { getDownloadLink } = require('../utils/FileDownloader.js');

const currentVersion = 'v3.3.7';

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function checkForUpdates(ws) {
  const builderVersion = (
    await getDownloadLink({ owner: 'reisxd', repo: 'revanced-builder' })
  ).version;

  if (builderVersion !== currentVersion)
    ws.send(
      JSON.stringify({
        event: 'notUpToDate',
        builderVersion
      })
    );
};
