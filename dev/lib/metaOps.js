const { isMove, isNewline, isRemline, isDel, isAdd } = require('./subdifOps');
const { deepCopy } = require('./utils');
const { compress } = require('./compress');

function saveLI(wrap, wTransformer, mode = 'default') {
  if (mode === 'default') {
    wrap.meta.informationLost = true;
    wrap.meta.context.original = deepCopy(wrap.sub);
    wrap.meta.context.wTransformer = deepCopy(wTransformer);
  }
  else if (mode === 'add') {
    wrap.metaAdd.informationLost = true;
    wrap.metaAdd.context.original = deepCopy(wrap.sub);
    wrap.metaAdd.context.wTransformer = deepCopy(wTransformer);
  }
  else if (mode === 'del') {
    wrap.metaDel.informationLost = true;
    wrap.metaDel.context.original = deepCopy(wrap.sub);
    wrap.metaDel.context.wTransformer = deepCopy(wTransformer);
  }
  else {
    console.log('Unknown mode in saveLI!');
  }
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
  // newlines and remlines are never relatively addressed
  if (isNewline(wrap) || isRemline(wrap)) {
    return false;
  }
  if (!isMove(wrap)) {
    return wrap.meta.relative;
  }
  return wrap.metaAdd.relative || wrap.metaDel.relative;
}

/// TODO: what if the transformer is move?
/**
 * @brief Checks whether the wrap lost information due to the transformer.
 *
 * @param {*} wrap
 * @param {*} wTransformer
 * @param {*} mode Used for move wraps. Either "add" or "del".
 * @returns
 */
function checkLI(wrap, wTransformer, mode = 'default') {
  if (!isMove(wrap)) {
    if (!wrap.meta.informationLost) {
      return false;
    }
    return wrap.meta.context.wTransformer.meta.ID === wTransformer.meta.ID;
  }

  if (mode === 'add') {
    if (!wrap.metaAdd.informationLost) {
      return false;
    }
    return wrap.metaAdd.context.wTransformer.meta.ID === wTransformer.meta.ID;
  }
  if (mode === 'del') {
    if (!wrap.metaDel.informationLost) {
      return false;
    }
    return wrap.metaDel.context.wTransformer.meta.ID === wTransformer.meta.ID;
  }

  console.log('Incorrect checkLI usage!');
  return false;
}

function recoverLI(wrap, mode = 'default') {
  if (!isMove(wrap)) {
    wrap.sub = wrap.meta.context.original;
    wrap.meta.informationLost = false;
  }
  else if (mode === 'add') {
    // the add part of move only handles where the moved text is pasted
    wrap.sub[2] = wrap.metaAdd.context.original[2];
    wrap.sub[3] = wrap.metaAdd.context.original[3];
    wrap.metaAdd.informationLost = false;
  }
  else if (mode === 'del') {
    // the del part of move handles from where the text was taken and how much of it
    wrap.sub[0] = wrap.metaDel.context.original[0];
    wrap.sub[1] = wrap.metaDel.context.original[1];
    wrap.sub[4] = wrap.metaDel.context.original[4];
    wrap.metaDel.informationLost = false;
  }
  // return wrap.meta.context.original;
}

function checkBO(wrap, wTransformer) {
  if (!isMove(wrap)) {
    return wrap.meta.context.addresser.meta.ID === wTransformer.meta.ID;
  }
  return wrap.metaAdd.context.addresser.meta.ID === wTransformer.meta.ID
           || wrap.metaDel.context.addresser.meta.ID === wTransformer.meta.ID;
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
      wrap.sub[1] += wAddresser.sub[1];
      wrap.meta.relative = false;
      wrap.meta.context.addresser = null;
    }
    else if (isNewline(wAddresser)) {
      // set the row equal to the newline
      wrap.sub[0] = wAddresser.sub;
      wrap.meta.relative = false;
      wrap.meta.context.addresser = null;
    }
    else {
      console.log('Conversion not implemented!');
    }
  }
  else if (isNewline(wrap) || isRemline(wrap)) {
    console.log('Conversion not implemented!');
  }
  else if (wrap.metaAdd.context.addresser.ID === wAddresser.meta.ID) {
    wrap.sub[3] += wAddresser.sub[1];
    wrap.metaAdd.relative = false;
    wrap.metaAdd.context.addresser = null;
  }
  else if (wrap.metaDel.context.addresser.ID === wAddresser.meta.ID) {
    wrap.sub[1] += wAddresser.sub[1];
    wrap.metaDel.relative = false;
    wrap.metaDel.context.addresser = null;
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
    /// TODO: implement move
    if (isMove(wrap)) {
      continue;
    }
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
    if (!isMove(wrap)) {
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
    }
    else {
      wNewDif.push(wrap);
    }
  });
  return wNewDif;
}

module.exports = {
  saveLI, saveRA, saveSibling, checkLI, checkRA, checkBO, recoverLI, convertAA, joinSiblings,
};
