const { existsSync, readFileSync, writeFileSync } = require('node:fs');

const defaultPatchesList = JSON.stringify(
  {
    packages: [
      {
        name: 'youtube',
        patches: []
      },
      {
        name: 'music',
        patches: []
      },
      {
        name: 'android',
        patches: []
      },
      {
        name: 'frontpage',
        patches: []
      },
      {
        name: 'warnapp',
        patches: []
      },
      {
        name: 'trill',
        patches: []
      }
    ]
  },
  null,
  2
);

function createRemembererFile() {
  writeFileSync('includedPatchesList.json', defaultPatchesList);
}

/**
 * @param {string} pkgName
 * @returns {Record<string, any>}
 */
function getPatchesList(pkgName) {
  const patchesList = JSON.parse(
    readFileSync('includedPatchesList.json', 'utf8')
  );

  return patchesList.packages.find((package) => package.name === pkgName).patches;
}

/**
 * @param {string} pkgName
 * @param {Record<string, any>} patches
 */
function writePatches(pkgName, patches) {
  const patchesList = JSON.parse(
    readFileSync('includedPatchesList.json', 'utf8')
  );

  const index = patchesList.packages.findIndex(
    (package) => package.name === pkgName
  );

  patchesList.packages[index].patches = patches;

  writeFileSync(
    'includedPatchesList.json',
    JSON.stringify(patchesList, null, 2)
  );
}

/**
 * @param {string} pkgName
 */
function getPatchList(pkgName) {
  if (!existsSync('includedPatchesList.json')) {
    createRemembererFile();

    return [];
  } else return getPatchesList(pkgName);
}

module.exports = {
  getPatchList,
  writePatches
};
