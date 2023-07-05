const { isNewline, isRemline, isDel, isAdd } = require('./subdifOps');
const { deepCopy } = require('./utils');
const { compress } = require('./compress');

function saveLI(wrap, wTransformer) {
  wrap.meta.informationLost = true;
  wrap.meta.context.original = deepCopy(wrap.sub);
  wrap.meta.context.wTransformer = deepCopy(wTransformer);
  return wrap;
}

function saveRA(wrap, addresser) {
  wrap.meta.relative = true;
  wrap.meta.context.addresser = addresser;
  return wrap;
}

function saveSibling(first, second) {
  first.meta.context.siblings.push(second.meta.ID);
}

function checkRA(wrap) {
  return wrap.meta.relative;
}

/**
 * @brief Checks whether the wrap lost information due to the transformer.
 *
 * @param {*} wrap
 * @param {*} wTransformer
 * @returns
 */
function checkLI(wrap, wTransformer) {
  if (!wrap.meta.informationLost) {
    return false;
  }
  return wrap.meta.context.wTransformer.meta.ID === wTransformer.meta.ID;
}

function recoverLI(wrap) {
  wrap.sub = wrap.meta.context.original;
  wrap.meta.informationLost = false;
}

function checkBO(wrap, wTransformer) {
  return wrap.meta.context.addresser.meta.ID === wTransformer.meta.ID;
}

/**
 * @param {*} wrap The wrap to be converted.
 * @param {*} wAddresser The wrapped addresser of the wrap.
 * @returns Returns the wrap that had been converted from relative addressing to absolute.
 */
function convertAA(wrap, wAddresser) {
  if (isAdd(wrap) || isDel(wrap)) {
    if (isAdd(wAddresser) || isDel(wAddresser)) {
      // add the position of the addresser to the relative offset of the wrap
      wrap.sub[0] = wAddresser.sub[0];
      wrap.sub[1] += wAddresser.sub[1];
      wrap.meta.relative = false;
      wrap.meta.context.addresser = null;
    }
    else if (isNewline(wAddresser)) {
      wrap.sub[0] = wAddresser.sub[0];
      wrap.sub[1] += wAddresser.sub[1];
      wrap.meta.relative = false;
      wrap.meta.context.addresser = null;
    }
    else {
      console.log('Conversion not implemented!');
    }
  }
  else if (isNewline(wrap)) {
    if (isAdd(wAddresser)) {
      wrap.sub[0] = wAddresser.sub[0];
      wrap.sub[1] += wAddresser.sub[1];
      wrap.meta.relative = false;
      wrap.meta.context.addresser = null;
    }
    else if (isNewline(wAddresser)) {
      wrap.sub[0] = wAddresser.sub[0];
      wrap.sub[1] += wAddresser.sub[1];
      wrap.meta.relative = false;
      wrap.meta.context.addresser = null;
    }
    else {
      console.log('Conversion not implemented!');
    }
  }
  else if (isRemline(wrap)) {
    if (isNewline(wAddresser)) {
      wrap.sub[0] = wAddresser.sub[0];
      wrap.sub[1] += wAddresser.sub[1];
      wrap.meta.relative = false;
      wrap.meta.context.addresser = null;
    }
    else {
      console.log('Conversion not implemented!');
    }
  }
  else {
    console.log('Unknown addresser in convertAA!');
  }
  return wrap;
}

/**
 * @brief Recursively joins all siblings of the first element, sets consumed siblings'
 *  sibling prop to null.
 * @param {*} wSlice A wDif slice, where the first element has siblings.
 * @returns Returns a joined wDif.
 */
function internalJoinSiblings(wSlice) {
  const wMain = wSlice[0];
  const wSiblings = [];
  const siblingIDs = wMain.meta.context.siblings;
  let i = 1;
  while (siblingIDs.length > 0) {
    const wrap = wSlice[i];
    // check if wrap is sibling
    if (siblingIDs.includes(wrap.meta.ID)) {
      // siblings will be defined, because this sibling could not be consumed yet
      if (wrap.meta.context.siblings.length > 0) {
        const wNewSlice = wSlice.slice(i);
        // join any nested siblings, making this have no more siblings
        internalJoinSiblings(wNewSlice);
      }
      wSiblings.push(wrap);
      siblingIDs.splice(siblingIDs.indexOf(wrap.meta.ID), 1);
    }
    i++;
  }

  const dif = [];
  dif.push(wMain.sub);
  wSiblings.forEach((wSibling) => {
    dif.push(wSibling.sub);
    wSibling.meta.context.siblings = null;

    // siblings should not have lost information or be relative, because they will be deleted
    if (wSibling.meta.informationLost || wSibling.meta.relative) {
      console.log('A sibling lost information or is relative!');
    }
  });

  const compressed = compress(dif);
  if (compressed.length !== 1) {
    console.log('The length of joined siblings is not 1!');
  }
  wMain.sub = compressed[0];
  return wMain;
}

function joinSiblings(wDif) {
  const wNewDif = [];
  wDif.forEach((wrap, i) => {
    const siblings = wrap.meta.context.siblings;
    // consumed siblings will have their siblings prop set to null
    if (siblings !== null) {
      if (siblings.length > 0) {
        // join siblings
        // wrap = ...
        wrap = internalJoinSiblings(wDif.slice(i));
      }
      wNewDif.push(wrap);
    }
  });
  return wNewDif;
}

module.exports = {
  saveLI, saveRA, saveSibling, checkLI, checkRA, checkBO, recoverLI, convertAA, joinSiblings,
};
