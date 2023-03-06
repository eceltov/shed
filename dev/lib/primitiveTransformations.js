/* eslint-disable function-call-argument-newline */
const {
  add, del, newline, remline,
  isAdd, isDel, isNewline, isRemline,
  wrapSubdif, unwrapSubdif, wrapDif, unwrapDif,
} = require('./subdifOps');
const { saveLI, saveRA, saveSibling, checkLI, recoverLI } = require('./metaOps');

function sameRow(wrap, wTransformer) {
  return wrap.sub[0] === wTransformer.sub[0];
}

function IT_AA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  if (wrap.sub[1] < transformer[1]) return wrap;
  wrap.sub[1] += transformer[2].length;
  return wrap;
}
function IT_AD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  if (wrap.sub[1] <= transformer[1]) return wrap;
  if (wrap.sub[1] > transformer[1] + transformer[2]) {
    wrap.sub[1] -= transformer[2];
  }
  else {
    saveLI(wrap, wTransformer);
    wrap.sub[1] = transformer[1];
  }
  return wrap;
}
function IT_AN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  // the line was split before the add position
  else if (sameRow(wrap, wTransformer) && transformer[1] <= wrap.sub[1]) {
    wrap.sub[0]++;
    wrap.sub[1] -= transformer[1];
  }
  return wrap;
}
function IT_AR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  else if (transformer[0] === wrap.sub[0]) {
    /**
     * In order to preserve the intention of adding characters,
       a new line has to be added and those characters will be added here.
      * Note that those character may not make semantically sense, if they were
        to be inserted in another set of characters that were deleted.
      */
    /**
     * Another idea is to do nothing, the remline was first, therefore the add might end up wrong
     */
    /// TODO: implement this
  }
  return wrap;
}
// @note May return an array with two subdifs
function IT_DA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
  if (wrap.sub[1] >= transformer[1]) {
    wrap.sub[1] += transformer[2].length;
    return wrap;
  }

  const wraps = [
    wrapSubdif(del(
      wrap.sub[0],
      wrap.sub[1],
      transformer[1] - wrap.sub[1],
    ), wrap.meta.ID, wrap.meta.context.siblings),
    wrapSubdif(del(
      wrap.sub[0],
      transformer[1] + transformer[2].length,
      wrap.sub[2] - (transformer[1] - wrap.sub[1]),
    )),
  ];
  saveSibling(wraps[0], wraps[1]);
  return wraps;
}
function IT_DD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
  if (wrap.sub[1] >= transformer[1] + transformer[2]) {
    wrap.sub = del(wrap.sub[0], wrap.sub[1] - transformer[2], wrap.sub[2]);
  }
  else {
    saveLI(wrap, wTransformer);
    if (
      transformer[1] <= wrap.sub[1]
      && wrap.sub[1] + wrap.sub[2] <= transformer[1] + transformer[2]
    ) {
      wrap.sub = del(wrap.sub[0], wrap.sub[1], 0);
    }
    else if (
      transformer[1] <= wrap.sub[1]
      && wrap.sub[1] + wrap.sub[2] > transformer[1] + transformer[2]
    ) {
      wrap.sub = del(
        wrap.sub[0], transformer[1], wrap.sub[1] + wrap.sub[2] - (transformer[1] + transformer[2]),
      );
    }
    else if (
      transformer[1] > wrap.sub[1]
      && transformer[1] + transformer[2] >= wrap.sub[1] + wrap.sub[2]
    ) {
      wrap.sub = del(wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1]);
    }
    else {
      wrap.sub = del(wrap.sub[0], wrap.sub[1], wrap.sub[2] - transformer[2]);
    }
  }
  return wrap;
}
// @note May return an array with two subdifs
function IT_DN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  else if (sameRow(wrap, wTransformer)) {
    if (transformer[1] <= wrap.sub[1]) {
      wrap.sub[0]++;
      wrap.sub[1] -= transformer[1];
    }
    else if (transformer[1] > wrap.sub[1] && transformer[1] < wrap.sub[1] + wrap.sub[2]) {
      const wraps = [
        wrapSubdif(del(
          wrap.sub[0],
          wrap.sub[1],
          transformer[1] - wrap.sub[1],
        ), wrap.meta.ID, wrap.meta.context.siblings),
        wrapSubdif(del(
          wrap.sub[0] + 1,
          0,
          wrap.sub[2] - (transformer[1] - wrap.sub[1]),
        )),
      ];
      saveSibling(wraps[0], wraps[1]);
      wrap = wraps;
    }
  }
  return wrap;
}
function IT_DR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  else if (transformer[0] === wrap.sub[0] && wrap.sub[1] + wrap.sub[2] > transformer[1]) {
    /**
     * The user tries to delete characters that no longer exist,
       therefore his intention was fulfilled by someone else and
        the deletion can be removed.
      */
    /// TODO: check if the empty del does not corrupt the algorithm
    wrap.sub = del(0, 0, 0);
  }
  return wrap;
}
function IT_NA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (sameRow(wrap, wTransformer) && transformer[1] <= wrap.sub[1]) {
    wrap.sub[1] += transformer[2].length;
  }
  return wrap;
}
function IT_ND(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (sameRow(wrap, wTransformer)) {
    if (transformer[1] < wrap.sub[1] && transformer[1] + transformer[2] >= wrap.sub[1]) {
      if (transformer[1] + transformer[2] > wrap.sub[1]) {
        saveLI(wrap, wTransformer);
      }
      wrap.sub[1] = transformer[1]; // the line will break at the start of the del
    }
    else if (transformer[1] + transformer[2] < wrap.sub[1]) {
      wrap.sub[1] -= transformer[2]; // subtract the length of the del
    }
  }
  return wrap;
}
function IT_NN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  else if (sameRow(wrap, wTransformer) && transformer[1] <= wrap.sub[1]) {
    wrap.sub[0]++;
    wrap.sub[1] -= transformer[1];
  }
  return wrap;
}
function IT_NR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  else if (transformer[0] === wrap.sub[0]) {
    /**
     * Leaving the newline as is should result in both operations canceling themselves out
     */
  }
  return wrap;
}
function IT_RA(wrap, wTransformer) {
  // case when the remline is disabled
  if (wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (sameRow(wrap, wTransformer)) {
    // disable the remline
    // saveLI(wrap, wTransformer);
    /// TODO: make sure that the remline should not be disabled

    // move the position so that it will again be on the end of the row
    wrap.sub[1] += transformer[2].length;
  }
  return wrap;
}
function IT_RD(wrap, wTransformer) {
  // case when the remline is disabled
  if (wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (sameRow(wrap, wTransformer)) {
    // it is assumed that the del is valid and will always delete characters
    // move the position so that it will again be on the end of the row
    wrap.sub[1] -= transformer[2];
  }
  return wrap;
}
function IT_RN(wrap, wTransformer) {
  // case when the remline is disabled
  if (wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  else if (transformer[0] === wrap.sub[0]) {
    if (transformer[1] > wrap.sub[1]) {
      console.log('IT_RN Newline is on a bigger position than the remline!');
    }
    else {
      wrap.sub[0]++;
      wrap.sub[1] -= transformer[1];
    }
  }
  return wrap;
}
function IT_RR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost || wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  else if (transformer[0] === wrap.sub[0]) {
    /**
         * Trying to delete a row that already had been deleted. The intention was
           fulfilled by someone else, therefore the subdif may be omitted.
         */
    /// TODO: not sure if this is the right way to disable a remline
    saveLI(wrap, wTransformer);
  }
  return wrap;
}

function ET_AA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  // equality removed because of the
  // IT(ET([0, 0, '3'], [0, 0, '2']), [0, 0, '2']) => [0, 0, '3'] example
  if (wrap.sub[1] < transformer[1]) return wrap;
  if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
    wrap.sub[1] -= transformer[2].length;
  }
  else {
    wrap.sub[1] -= transformer[1];
    saveRA(wrap, wTransformer);
  }
  return wrap;
}
function ET_AD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  if (checkLI(wrap, wTransformer)) {
    recoverLI(wrap);
  }
  else if (wrap.sub[1] <= transformer[1]) return wrap;
  else {
    wrap.sub[1] += transformer[2];
  }
  return wrap;
}
function ET_AN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  // the add is on the line made by the newline
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  // the add was added to the new empty space created on the original row
  else if (transformer[0] === wrap.sub[0] && transformer[1] === wrap.sub[1]) {
    // the add is relative to the newline, otherwise including the newline would push the add to the
    // next row
    saveRA(wrap, wTransformer);
    wrap.sub[1] = 0;
  }
  return wrap;
}
function ET_AR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  // case when the add was part of the text on the removed line
  else if (sameRow(wrap, wTransformer) && transformer[1] <= wrap.sub[1]) {
    wrap.sub[0]++;
    wrap.sub[1] -= transformer[1];
  }
  return wrap;
}
// @note May return an array with two subdifs
function ET_DA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  if (wrap.sub[1] + wrap.sub[2] <= transformer[1]) return wrap;
  if (wrap.sub[1] >= transformer[1] + transformer[2].length) {
    wrap.sub[1] -= transformer[2].length;
  }
  else if (
    transformer[1] <= wrap.sub[1]
    && wrap.sub[1] + wrap.sub[2] <= transformer[1] + transformer[2].length
  ) {
    wrap.sub[1] -= transformer[1];
    saveRA(wrap, wTransformer);
  }
  else if (
    transformer[1] <= wrap.sub[1]
    && wrap.sub[1] + wrap.sub[2] > transformer[1] + transformer[2].length
  ) {
    const delWrap1 = wrapSubdif(del(
      wrap.sub[0],
      wrap.sub[1] - transformer[1],
      transformer[1] + transformer[2].length - wrap.sub[1],
    ), wrap.meta.ID, wrap.meta.context.siblings);
    const delWrap2 = wrapSubdif(del(
      wrap.sub[0],
      transformer[1],
      wrap.sub[1] + wrap.sub[2] - transformer[1] - transformer[2].length,
    ));
    saveRA(delWrap1, wTransformer);
    saveSibling(delWrap1, delWrap2);
    return [delWrap1, delWrap2];
  }
  else if (
    transformer[1] > wrap.sub[1]
    && transformer[1] + transformer[2].length <= wrap.sub[1] + wrap.sub[2]
  ) {
    const delWrap1 = wrapSubdif(del(
      wrap.sub[0], 0, transformer[2].length,
    ), wrap.meta.ID, wrap.meta.context.siblings);
    const delWrap2 = wrapSubdif(del(
      wrap.sub[0], wrap.sub[1], wrap.sub[2] - transformer[2].length,
    ));
    saveRA(delWrap1, wTransformer);
    saveSibling(delWrap1, delWrap2);
    return [delWrap1, delWrap2];
  }
  else {
    const delWrap1 = wrapSubdif(del(
      wrap.sub[0], 0, wrap.sub[1] + wrap.sub[2] - transformer[1],
    ), wrap.meta.ID, wrap.meta.context.siblings);
    const delWrap2 = wrapSubdif(del(
      wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1],
    ));
    saveRA(delWrap1, wTransformer);
    saveSibling(delWrap1, delWrap2);
    return [delWrap1, delWrap2];
  }
  return wrap;
}
// @note May return an array with two subdifs
function ET_DD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (!sameRow(wrap, wTransformer)) return wrap;
  if (checkLI(wrap, wTransformer)) {
    recoverLI(wrap);
  }
  else if (transformer[1] >= wrap.sub[1] + wrap.sub[2]) return wrap;
  else if (wrap.sub[1] >= transformer[1]) {
    wrap.sub[1] += transformer[2];
  }
  else {
    const delWrap1 = wrapSubdif(del(
      wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1],
    ), wrap.meta.ID, wrap.meta.context.siblings);
    const delWrap2 = wrapSubdif(del(
      wrap.sub[0], transformer[1] + transformer[2], wrap.sub[1] + wrap.sub[2] - transformer[1],
    ));
    saveSibling(delWrap1, delWrap2);
    return [delWrap1, delWrap2];
  }
  return wrap;
}
function ET_DN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  // nothing has to be done if the del and newline are on the same row,
  // because the only dels that moved are on the next line and only those need
  // to be transformed
  return wrap;
}
// @note May return multiple subdifs.
function ET_DR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  // case when the del was part of the text on the removed line
  else if (sameRow(wrap, wTransformer) && transformer[1] <= wrap.sub[1]) {
    wrap.sub[0]++;
    wrap.sub[1] -= transformer[1];
  }
  // case when the removed remline splits the del
  else if (sameRow(wrap, wTransformer)
    && wrap.sub[1] < transformer[1]
    && wrap.sub[1] + wrap.sub[2] > transformer[1]
  ) {
    const delWrap1 = wrapSubdif(del(
      wrap.sub[0], wrap.sub[1], transformer[1] - wrap.sub[1],
    ), wrap.meta.ID, wrap.meta.context.siblings);
    const delWrap2 = wrapSubdif(del(
      wrap.sub[0] + 1, 0, wrap.sub[1] + wrap.sub[2] - transformer[1],
    ));
    saveSibling(delWrap1, delWrap2);
    wrap = [delWrap1, delWrap2];
  }
  return wrap;
}
function ET_NA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (sameRow(wrap, wTransformer)) {
    /// TODO: should that inequality be sharp instead (like in ET_AA)?
    // case when the whole add is in front of the newline
    if (transformer[1] + transformer[2].length <= wrap.sub[1]) {
      wrap.sub[1] -= transformer[2].length;
    }
    // case when the newline is in the middle of the add, relative addressing needs to be used
    else if (
      transformer[1] <= wrap.sub[1]
      && transformer[1] + transformer[2].length > wrap.sub[1]
    ) {
      saveRA(wrap, wTransformer);
      wrap.sub[1] -= transformer[1];
    }
  }
  return wrap;
}
function ET_ND(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (checkLI(wrap, wTransformer)) {
    recoverLI(wrap);
  }
  /// TODO: should the inequality be sharp?
  else if (sameRow(wrap, wTransformer) && transformer[1] < wrap.sub[1]) {
    wrap.sub[1] += transformer[2];
  }
  return wrap;
}
function ET_NN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  // the newline was added to the new empty space created on the original row
  else if (transformer[0] === wrap.sub[0] && transformer[1] === wrap.sub[1]) {
    // the wrap is relative to the transformer, otherwise including the transformer would push
    // the wrap to the next row
    saveRA(wrap, wTransformer);
    wrap.sub[1] = 0;
  }
  return wrap;
}
function ET_NR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  // case when the newline was part of the text on the removed line
  else if (sameRow(wrap, wTransformer) && transformer[1] <= wrap.sub[1]) {
    wrap.sub[0]++;
    wrap.sub[1] -= transformer[1];
  }
  return wrap;
}
function ET_RA(wrap, wTransformer) {
  // case when the remline is disabled
  if (wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (sameRow(wrap, wTransformer)) {
    // the remline is dependent on the add, therefore it has to be positioned before the remline
    // move the position so that it will again be on the end of the row
    wrap.sub[1] -= transformer[2].length;
  }
  return wrap;
}
function ET_RD(wrap, wTransformer) {
  // case when the remline is disabled
  if (wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (sameRow(wrap, wTransformer)) {
    // the remline is dependent on the add, therefore it has to be positioned before the remline
    // move the position so that it will again be on the end of the row
    wrap.sub[1] += transformer[2];
  }
  return wrap;
}
function ET_RN(wrap, wTransformer) {
  // case when the remline is disabled
  if (wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0] - 1) {
    wrap.sub[0]--;
  }
  else if (transformer[0] === wrap.sub[0] - 1) {
    wrap.sub[0]--;
    wrap.sub[1] += transformer[1];
  }
  // the remline makes sense only in combination with the newline, it has to be made relative
  else if (transformer[0] === wrap.sub[0]) {
    wrap.sub[1] -= transformer[1];
    saveRA(wrap, wTransformer);
  }
  return wrap;
}
function ET_RR(wrap, wTransformer) {
  // case when the remline is disabled
  if (checkLI(wrap, wTransformer)) {
    recoverLI(wrap);
    return wrap;
  }
  if (wTransformer.meta.informationLost || wrap.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (transformer[0] < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  // the positional check is not done here because the wrap needs to be part of the text
  // of the deleted row, else it would not be dependent on the transformer
  else if (sameRow(wrap, wTransformer)) {
    wrap.sub[0]++;
    wrap.sub[1] -= transformer[1];
  }
  return wrap;
}

/// TODO: consider returning an array from all prim transform functions
function IT(wrap, wTransformer) {
  const transformedWraps = [];
  if (isAdd(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(IT_AA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(IT_AD(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(IT_AN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(IT_AR(wrap, wTransformer));
  }
  else if (isDel(wrap)) {
    if (isAdd(wTransformer)) {
      const result = IT_DA(wrap, wTransformer);
      if (isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isDel(wTransformer)) transformedWraps.push(IT_DD(wrap, wTransformer));
    else if (isNewline(wTransformer)) {
      const result = IT_DN(wrap, wTransformer);
      if (isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isRemline(wTransformer)) transformedWraps.push(IT_DR(wrap, wTransformer));
  }
  else if (isNewline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(IT_NA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(IT_ND(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(IT_NN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(IT_NR(wrap, wTransformer));
  }
  else if (isRemline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(IT_RA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(IT_RD(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(IT_RN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(IT_RR(wrap, wTransformer));
  }
  return transformedWraps;
}

function ET(wrap, wTransformer) {
  const transformedWraps = [];
  if (isAdd(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(ET_AA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(ET_AD(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(ET_AN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(ET_AR(wrap, wTransformer));
  }
  else if (isDel(wrap)) {
    if (isAdd(wTransformer)) {
      const result = ET_DA(wrap, wTransformer);
      if (isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isDel(wTransformer)) {
      const result = ET_DD(wrap, wTransformer);
      if (isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isNewline(wTransformer)) transformedWraps.push(ET_DN(wrap, wTransformer));
    else if (isRemline(wTransformer)) {
      const result = ET_DR(wrap, wTransformer);
      if (isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
  }
  else if (isNewline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(ET_NA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(ET_ND(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(ET_NN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(ET_NR(wrap, wTransformer));
  }
  else if (isRemline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(ET_RA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(ET_RD(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(ET_RN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(ET_RR(wrap, wTransformer));
  }
  return transformedWraps;
}

module.exports = {
  IT, ET,
};
