const fetch = require('./fetch.js');
const { load } = require('cheerio');
const { dloadFromURL } = require('./FileDownloader.js');

/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function downloadApp(ws) {
  const { version, arch } = global.apkInfo;
  const apkMirrorVersionArg = version.replace(/\./g, '-');

  let versionDownload;

  switch (global.jarNames.selectedApp) {
    case 'youtube':
      versionDownload = await fetch(
        `https://www.apkmirror.com/apk/google-inc/youtube/youtube-${apkMirrorVersionArg}-release/`
      );
      break;
    case 'music':
      versionDownload = await fetch(
        `https://www.apkmirror.com/apk/google-inc/youtube-music/youtube-music-${apkMirrorVersionArg}-release/`
      );
      break;
    case 'android':
      versionDownload = await fetch(
        `https://www.apkmirror.com/apk/twitter-inc/twitter/twitter-${apkMirrorVersionArg}-release/`
      );
      break;
    case 'frontpage':
      versionDownload = await fetch(
        `https://www.apkmirror.com/apk/redditinc/reddit/reddit-${apkMirrorVersionArg}-release/`
      );
      break;
    case 'warnapp':
      versionDownload = await fetch(
        `https://www.apkmirror.com/apk/deutscher-wetterdienst/warnwetter/warnwetter-${apkMirrorVersionArg}-release/`
      );
      break;
    case 'trill':
      versionDownload = await fetch(
        `https://www.apkmirror.com/apk/tiktok-pte-ltd/tik-tok/tik-tok-${apkMirrorVersionArg}-release/`
      );
  }

  if (!versionDownload.ok) {
    ws.send(
      JSON.stringify({
        event: 'error',
        error: `Failed to scrape download link for ${version}.<br>Please try downgrading.`
      })
    );

    return;
  }

  const versionDownloadList = await versionDownload.text();

  const $ = load(versionDownloadList);

  const dlLink =
    arch && global.jarNames.selectedApp === 'music'
      ? $(`div:contains("${arch}")`)
          .parent()
          .children('div[class^="table-cell rowheight"]')
          .first()
          .children('a[class="accent_color"]')
          .first()
          .attr('href')
      : $('span[class="apkm-badge"]')
          .first()
          .parent()
          .children('a[class="accent_color"]')
          .first()
          .attr('href');

  const downloadLinkPage = await fetch(
    `https://www.apkmirror.com${dlLink}`
  ).then((res) => res.text());

  const $2 = load(downloadLinkPage);
  const pageLink = $2('a[class^="accent_bg btn btn-flat downloadButton"]')
    .first()
    .attr('href');

  const downloadPage = await fetch(`https://www.apkmirror.com${pageLink}`).then(
    (res) => res.text()
  );
  const $3 = load(downloadPage);
  const apkLink = $3('a[rel="nofollow"]').first().attr('href');

  await dloadFromURL(
    `https://www.apkmirror.com${apkLink}`,
    `./revanced/${global.jarNames.selectedApp}.apk`,
    ws
  );

  ws.send(
    JSON.stringify({
      event: 'finished'
    })
  );
};
