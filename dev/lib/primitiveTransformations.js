/* eslint-disable function-call-argument-newline */
const {
  add, del, move, newline, remline,
  isAdd, isDel, isMove, isNewline, isRemline,
  wrapSubdif, unwrapSubdif, wrapDif, unwrapDif,
} = require('./subdifOps');
const { saveLI, saveRA, saveSibling, checkLI, recoverLI } = require('./metaOps');

function sameRow(wrap, wTransformer) {
  return wrap.sub[0] === wTransformer.sub[0];
}

function mockupString(length) {
  return {
    length,
  };
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
function IT_AM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = IT_AD(wrap, wrapSubdif(
      del(transformer[0], transformer[1], transformer[4]),
    ));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap = IT_AA(wrap, wrapSubdif(
      add(transformer[2], transformer[3], mockupString(transformer[4])),
    ));
  }
  return wrap;
}
function IT_AN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
}
function IT_AR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]--;
  }
  else if (-transformer === wrap.sub[0]) {
    /**
         * In order to preserve the intention of adding characters,
           a new line has to be added and those characters will be added here.
         * Note that those character may not make semantically sense, if they were
           to be inserted in another set of characters that were deleted.
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
    ), wrap.meta.ID),
    wrapSubdif(del(
      wrap.sub[0],
      transformer[1] + transformer[2].length,
      wrap.sub[2] - (transformer[1] - wrap.sub[1]),
    ))];
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
function IT_DM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = IT_DD(wrap, del(transformer[0], transformer[1], transformer[4]));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap = IT_DA(
      wrap, add(transformer[2], transformer[3], mockupString(transformer[4])),
    );
  }
  return wrap;
}
function IT_DN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
}
function IT_DR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]--;
  }
  else if (-transformer === wrap.sub[0]) {
    /**
         * The user tries to delete characters that no longer exist,
           therefore his intention was fulfilled by someone else and
           the deletion can be removed.
         */
    wrap.sub = del(0, 0, 0);
  }
  return wrap;
}
// @note May return an array with two subdifs
function IT_MA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = IT_DA(
      wrapSubdif(del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), wTransformer,
    );
    if (isDel(delWrap)) {
      wrap.sub[1] = delWrap.sub[1];
    }
    else {
      const wraps = [
        wrapSubdif(move(
          wrap.sub[0],
          delWrap[0].sub[1],
          wrap.sub[2],
          wrap.sub[3],
          delWrap[0].sub[2],
        )),
        wrapSubdif(move(
          wrap.sub[0],
          delWrap[1].sub[1],
          wrap.sub[2],
          wrap.sub[3] + delWrap[0].sub[2],
          delWrap[1].sub[2],
        )),
      ];
      saveSibling(wraps[0], wraps[1]);
      return wraps;
    }
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = IT_AA(
      wrapSubdif(add(wrap.sub[2], wrap.sub[3], mockupString(wrap.sub[4]))),
      wTransformer,
    );
    wrap.sub[3] = addWrap.sub[1];
  }
  return wrap;
}
function IT_MD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = IT_DD(
      wrapSubdif(del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), wTransformer,
    );
    if (delWrap.meta.informationLost) {
      saveLI(wrap, wTransformer, 'del');
    }
    wrap.sub[1] = delWrap.sub[1];
    wrap.sub[4] = delWrap.sub[2];
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = IT_AD(
      wrapSubdif(add(wrap.sub[2], wrap.sub[3], mockupString(wrap.sub[4]))),
      wTransformer,
    );
    if (addWrap.meta.informationLost) {
      saveLI(wrap, wTransformer, 'add');
    }
    wrap.sub[3] = addWrap[1];
  }
  return wrap;
}
// @note May return an array with two subdifs
function IT_MM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = IT_MD(
      wrap, wrapSubdif(del(transformer[0], transformer[1], transformer[4])),
    );
  }
  if (wrap.sub[0] === transformer[2]) {
    const delWrap = IT_DA(
      wrapSubdif(del(wrap.sub[0], wrap.sub[1], wrap.sub[4])),
      wrapSubdif(add(
        transformer[2], transformer[3], mockupString(transformer[4]),
      )),
    );
    if (isDel(delWrap)) {
      wrap.sub[1] = delWrap.sub[1];
    }
    else {
      // splitting the move into two sections
      const moveWrap1 = wrapSubdif(
        move(wrap.sub[0], delWrap[0].sub[1], wrap.sub[2], wrap.sub[3], delWrap[0].sub[2]),
      );
      const moveWrap2 = wrapSubdif(move(
        wrap.sub[0],
        delWrap[1].sub[1],
        wrap.sub[2],
        wrap.sub[3] + delWrap[0].sub[2],
        delWrap[1].sub[2],
      ));
      /// TODO: add sibling
      /// TODO: implement this
      /* if (wrap.sub[2] === transformer[0]) {
                let addWrap = IT_AD(
                  add(move1[2], move1[3], mockupString(move1[4])),
                  del(transformer[0], transformer[1], transformer[4]),
                );
                move1[3] = addWrap[1];
                // appending the second move right after the first one
                move2[3] = addWrap[1] + move1[4];
            } */
      console.log('IT_MM not implemented');
      return [moveWrap1, moveWrap2];
    }
  }
  if (wrap.sub[2] === transformer[0]) {
    wrap = IT_MD(
      wrap, wrapSubdif(del(transformer[0], transformer[1], transformer[4])),
    );
  }
  if (wrap.sub[2] === transformer[2]) {
    wrap = IT_MA(
      wrap, wrapSubdif(
        add(transformer[2], transformer[3], mockupString(transformer[4])),
      ),
    );
  }
  return wrap;
}
function IT_MN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (checkLI(wrap, wTransformer, 'add')) {
    recoverLI(wrap, 'add');
    return wrap;
  }
  if (checkLI(wrap, wTransformer, 'del')) {
    recoverLI(wrap, 'del');
    return wrap;
  }
  if (wrap.sub[0] >= transformer) wrap.sub[0]++;
  if (wrap.sub[2] >= transformer) wrap.sub[2]++;
  return wrap;
}
function IT_MR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) wrap.sub[0]--;
  else if (-transformer === wrap.sub[0]) {
    /**
         * The text that had to be moved no longer exists, therefore
           the move operation can be removed.
         */
    wrap.sub = move(0, 0, 0, 0, 0);
  }
  if (-transformer < wrap.sub[2]) wrap.sub[2]--;
  else if (-transformer === wrap.sub[2]) {
    /**
         * The target row no longer exists, therefore a new row has to be
           added (similarily to IT_AR)
         */
    /// TODO: implement this
  }
  return wrap;
}
function IT_NA(wrap, wTransformer) {
  return wrap;
}
function IT_ND(wrap, wTransformer) {
  return wrap;
}
function IT_NM(wrap, wTransformer) {
  return wrap;
}
function IT_NN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= wrap.sub) wrap.sub++;
  return wrap;
}
function IT_NR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub) wrap.sub--;
  else if (-transformer === wrap.sub) {
    /**
         * The place to add the new line might be deleted.
         * The solution would be to add the newline at the same position, or
           if the position does not exist, add a newline at the end of the document.
         */
    /// TODO: implement this
  }
  return wrap;
}
function IT_RA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (-wrap.sub === transformer[0]) {
    // disable the remline
    saveLI(wrap, wTransformer);
  }
  return wrap;
}
function IT_RD(wrap, wTransformer) {
  return wrap;
}
function IT_RM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (-wrap.sub === transformer[2]) {
    console.log('Transforming remline agains a move addition on the same row!');
    // disable the remline
    saveLI(wrap, wTransformer);
  }
  return wrap;
}
function IT_RN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer <= -wrap.sub) wrap.sub--;
  return wrap;
}
function IT_RR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < -wrap.sub) wrap.sub++;
  if (transformer === wrap.sub) {
    /**
         * Trying to delete a row that already had been deleted. The intention was
           fulfilled by someone else, therefore the subdif may be omitted.
         */
    /// TODO: implement this
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
function ET_AM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap.sub = ET_AD(wrap, del(transformer[0], transformer[1], transformer[4]));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap.sub = ET_AA(
      wrap, add(transformer[2], transformer[3], mockupString(transformer[4])),
    );
  }
  return wrap;
}
function ET_AN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub[0]) { /// TODO: revise this
    wrap.sub[0]--;
  }
  // if the addition occured on a row being excluded, relative addressing has to be used
  else if (transformer === wrap.sub[0]) {
    saveRA(wrap, wTransformer);
  }
  return wrap;
}
function ET_AR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]++;
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
    ), wrap.meta.ID);
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
    ), wrap.meta.ID);
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
    ), wrap.meta.ID);
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
    ), wrap.meta.ID);
    const delWrap2 = wrapSubdif(del(
      wrap.sub[0], transformer[1] + transformer[2], wrap.sub[1] + wrap.sub[2] - transformer[1],
    ));
    saveSibling(delWrap1, delWrap2);
    return [delWrap1, delWrap2];
  }
  return wrap;
}
// @note May return an array with two subdifs
/// TODO: the wrap might be losing some meta information here
function ET_DM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    wrap = ET_DD(wrap, del(transformer[0], transformer[1], transformer[4]));
  }
  else if (wrap.sub[0] === transformer[2]) {
    wrap = ET_DA(wrap, add(
      transformer[2], transformer[3], mockupString(transformer[4]),
    ));
  }
  return wrap;
}
function ET_DN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub[0]) { /// TODO: revise this
    wrap.sub[0]--;
  }
  // if the deletion occured on a row being excluded, relative addressing has to be used
  else if (transformer === wrap.sub[0]) {
    saveRA(wrap, wTransformer);
  }
  return wrap;
}
function ET_DR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) {
    wrap.sub[0]++;
  }
  return wrap;
}
// @note May return an array with two subdifs
function ET_MA(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = ET_DA(
      wrapSubdif(del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer,
    );
    if (isDel(delWrap)) {
      wrap.sub[1] = delWrap.sub[1];
      wrap.metaDel.relative = delWrap.meta.relative;
      wrap.metaDel.context.addresser = delWrap.meta.context.addresser;
    }
    else {
      const delWrap1 = delWrap[0];
      const delWrap2 = delWrap[1];
      const moveWrap1 = wrapSubdif(move(
        wrap.sub[0], delWrap1.sub[1], wrap.sub[2], wrap.sub[3], delWrap1.sub[2],
      ));
      moveWrap1.metaDel = delWrap1.meta;
      const moveWrap2 = wrapSubdif(move(
        wrap.sub[0], delWrap2.sub[1], wrap.sub[2], wrap.sub[3] + delWrap1.sub[2], delWrap2.sub[2],
      ));
      moveWrap2.metaDel = delWrap2.meta;
      saveSibling(moveWrap1, moveWrap2);
      return [moveWrap1, moveWrap2];
    }
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = ET_AA(
      wrapSubdif(add(wrap.sub[2], wrap.sub[3], mockupString(wrap.sub[4]))),
      transformer,
    );
    wrap.sub[3] = addWrap.sub[1];
    wrap.metaAdd.relative = addWrap.meta.relative;
    wrap.metaAdd.context.addresser = addWrap.meta.context.addresser;
  }
  return wrap;
}
// @note May return an array with two subdifs
function ET_MD(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (wrap.sub[0] === transformer[0]) {
    const delWrap = ET_DD(
      wrapSubdif(del(wrap.sub[0], wrap.sub[1], wrap.sub[4])), transformer,
    );
    if (isDel(delWrap)) {
      wrap.sub = delWrap.sub;
    }
    else {
      const delWrap1 = delWrap[0];
      const delWrap2 = delWrap[1];
      const moveWrap1 = wrapSubdif(move(
        wrap.sub[0], delWrap1.sub[1], wrap.sub[2], wrap.sub[3], delWrap1.sub[2],
      ));
      const moveWrap2 = wrapSubdif(move(
        wrap.sub[0], delWrap2.sub[1], wrap.sub[2], wrap.sub[3] + delWrap1.sub[2], delWrap2.sub[2],
      ));
      saveSibling(moveWrap1, moveWrap2);
      return [moveWrap1, moveWrap2];
    }
  }
  else if (wrap.sub[2] === transformer[0]) {
    const addWrap = ET_AD(
      wrapSubdif(
        add(wrap.sub[2], wrap.sub[3], mockupString(wrap.sub[4])),
      ),
      transformer,
    );
    wrap.sub[3] = addWrap[1];
  }
  return wrap;
}
// @note May return an array with two subdifs
function ET_MM(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  /// TODO: finish
  console.log('Not implemented ET_MM');
  return wrap;
}
function ET_MN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub[0]) wrap.sub[0]--;
  else if (transformer === wrap.sub[0]) {
    saveLI(wrap, wTransformer, 'del');
  }

  if (transformer < wrap.sub[2]) wrap.sub[2]--;
  else if (transformer === wrap.sub[2]) {
    saveLI(wrap, wTransformer, 'add');
  }
  return wrap;
}
function ET_MR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub[0]) wrap.sub[0]++;
  if (-transformer < wrap.sub[2]) wrap.sub[2]++;
  return wrap;
}
function ET_NA(wrap, wTransformer) {
  return wrap;
}
function ET_ND(wrap, wTransformer) {
  return wrap;
}
function ET_NM(wrap, wTransformer) {
  return wrap;
}
function ET_NN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < wrap.sub) wrap.sub--;
  // the addressing has to be relative for equal newline, else IT(ET([0, 0])) === [0, 1]
  else if (transformer === wrap.sub) {
    saveRA(wrap, wTransformer);
  }
  return wrap;
}
function ET_NR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < wrap.sub) wrap.sub++;
  return wrap;
}
function ET_RA(wrap, wTransformer) {
  /// TODO: this might be redundant
  if (checkLI(wrap, wTransformer)) {
    recoverLI(wrap);
  }
  return wrap;
}
function ET_RD(wrap, wTransformer) {
  return wrap;
}
function ET_RM(wrap, wTransformer) {
  /// TODO: this might be redundant
  if (checkLI(wrap, wTransformer)) {
    recoverLI(wrap);
  }
  return wrap;
}
function ET_RN(wrap, wTransformer) {
  const transformer = wTransformer.sub;
  if (transformer < -wrap.sub) wrap.sub++;
  // the remline makes sense only in combination with the newline, it has to be made relative
  else if (transformer === -wrap.sub) {
    saveRA(wrap, wTransformer);
  }
  return wrap;
}
function ET_RR(wrap, wTransformer) {
  // case when the remline is disabled
  if (wTransformer.meta.informationLost) {
    return wrap;
  }
  const transformer = wTransformer.sub;
  if (-transformer < -wrap.sub) wrap.sub--;
  return wrap;
}

/// TODO: consider returning an array from all prim transform functions
function IT(wrap, wTransformer) {
  const transformedWraps = [];
  if (isAdd(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(IT_AA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(IT_AD(wrap, wTransformer));
    else if (isMove(wTransformer)) transformedWraps.push(IT_AM(wrap, wTransformer));
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
    else if (isMove(wTransformer)) {
      const result = IT_DM(wrap, wTransformer);
      if (isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isNewline(wTransformer)) transformedWraps.push(IT_DN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(IT_DR(wrap, wTransformer));
  }
  else if (isMove(wrap)) {
    if (isAdd(wTransformer)) {
      const result = IT_MA(wrap, wTransformer);
      if (isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isDel(wTransformer)) transformedWraps.push(IT_MD(wrap, wTransformer));
    else if (isMove(wTransformer)) {
      const result = IT_MM(wrap, wTransformer);
      if (isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isNewline(wTransformer)) transformedWraps.push(IT_MN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(IT_MR(wrap, wTransformer));
  }
  else if (isNewline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(IT_NA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(IT_ND(wrap, wTransformer));
    else if (isMove(wTransformer)) transformedWraps.push(IT_NM(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(IT_NN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(IT_NR(wrap, wTransformer));
  }
  else if (isRemline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(IT_RA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(IT_RD(wrap, wTransformer));
    else if (isMove(wTransformer)) transformedWraps.push(IT_RM(wrap, wTransformer));
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
    else if (isMove(wTransformer)) transformedWraps.push(ET_AM(wrap, wTransformer));
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
    else if (isMove(wTransformer)) {
      const result = ET_DM(wrap, wTransformer);
      if (isDel(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isNewline(wTransformer)) transformedWraps.push(ET_DN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(ET_DR(wrap, wTransformer));
  }
  else if (isMove(wrap)) {
    if (isAdd(wTransformer)) {
      const result = ET_MA(wrap, wTransformer);
      if (isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isDel(wTransformer)) {
      const result = ET_MD(wrap, wTransformer);
      if (isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isMove(wTransformer)) {
      const result = ET_MM(wrap, wTransformer);
      if (isMove(result)) transformedWraps.push(result);
      else {
        transformedWraps.push(result[0]);
        transformedWraps.push(result[1]);
      }
    }
    else if (isNewline(wTransformer)) transformedWraps.push(ET_MN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(ET_MR(wrap, wTransformer));
  }
  else if (isNewline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(ET_NA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(ET_ND(wrap, wTransformer));
    else if (isMove(wTransformer)) transformedWraps.push(ET_NM(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(ET_NN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(ET_NR(wrap, wTransformer));
  }
  else if (isRemline(wrap)) {
    if (isAdd(wTransformer)) transformedWraps.push(ET_RA(wrap, wTransformer));
    else if (isDel(wTransformer)) transformedWraps.push(ET_RD(wrap, wTransformer));
    else if (isMove(wTransformer)) transformedWraps.push(ET_RM(wrap, wTransformer));
    else if (isNewline(wTransformer)) transformedWraps.push(ET_RN(wrap, wTransformer));
    else if (isRemline(wTransformer)) transformedWraps.push(ET_RR(wrap, wTransformer));
  }
  return transformedWraps;
}

module.exports = {
  IT, ET,
};
