const { deepCopy } = require('./utils');
const { add, del, isAdd, isDel } = require('./subdifOps');

function getCompressionObj(newFirst, newSecond) {
  return {
    newFirst,
    newSecond,
  };
}

function subdifsTouchOrIntersect(
  row1, position1, length1, row2, position2, length2,
) {
  if (row1 !== row2) return false;
  return ((position1 >= position2 && position1 <= position2 + length2)
    || (position2 >= position1 && position2 <= position1 + length1));
}

function removeEmptySubdifs(dif) {
  for (let i = 0; i < dif.length; ++i) {
    if (isAdd(dif[i])) {
      if (dif[i][2] === '') {
        dif.splice(i, 1);
        --i;
      }
    }
    else if (isDel(dif[i])) {
      if (dif[i][2] === 0) {
        dif.splice(i, 1);
        --i;
      }
    }
  }
}

function addAddCompression(first, second) {
  let compressionObj = null;

  if (subdifsTouchOrIntersect(
    first[0], first[1], first[2].length, second[0], second[1], second[2].length,
  )) {
    const minPosition = first[1] < second[1] ? first[1] : second[1];
    let newString;
    if (first[1] >= second[1]) {
      // the second string will get put before the first one
      newString = second[2] + first[2];
    }
    else {
      // the second string will be inserted into the first one
      const firstSegmentLength = second[1] - first[1];
      newString = first[2].substring(0, firstSegmentLength);
      newString += second[2];
      newString += first[2].substring(firstSegmentLength);
    }
    const newFirst = add(first[0], minPosition, newString);
    compressionObj = getCompressionObj(newFirst, null);
  }

  return compressionObj;
}

function delDelCompression(first, second) {
  let compressionObj;

  if (first[0] !== second[0]) {
    compressionObj = null;
  }
  else if (first[1] === second[1]) {
    const newFirst = del(first[0], first[1], first[2] + second[2]);
    compressionObj = getCompressionObj(newFirst, null);
  }
  else if (first[1] > second[1] && second[1] + second[2] >= first[1]) {
    const newFirst = del(first[0], second[1], first[2] + second[2]);
    compressionObj = getCompressionObj(newFirst, null);
  }
  else {
    compressionObj = null;
  }

  return compressionObj;
}

function addDelCompression(addSubdif, delSubdif) {
  const row = addSubdif[0];
  const posAdd = addSubdif[1];
  const text = addSubdif[2];
  const posDel = delSubdif[1];
  const delRange = delSubdif[2];
  let compressionObj;

  if (addSubdif[0] !== delSubdif[0]) {
    compressionObj = null;
  }
  // deleting whole add
  else if (posDel <= posAdd && posDel + delRange >= posAdd + text.length) {
    // the del and add start at the same position
    if (posDel === posAdd) {
      // the del exactly deletes the add, both will be removed
      if (posDel + delRange === posAdd + text.length) {
        compressionObj = getCompressionObj(null, null);
      }
      // the del is longer than the add
      else {
        const newDel = del(row, posDel, delRange - posAdd - text.length);
        compressionObj = getCompressionObj(newDel, null);
      }
    }
    // the del is positioned before the add
    else {
      const newDel = del(row, posDel, delRange - text.length);
      compressionObj = getCompressionObj(newDel, null);
    }
  }
  // deleting from the middle (not deleting edges)
  else if (posAdd + text.length > posDel + delRange && posAdd < posDel) {
    const newText = text.substring(0, posDel) + text.substring(posDel + delRange);
    const newAdd = add(row, posAdd, newText);
    compressionObj = getCompressionObj(newAdd, null);
  }
  // deleting from the left
  else if (posDel <= posAdd && posDel + delRange > posAdd) {
    // the del and add start at the same position
    if (posDel === posAdd) {
      const newText = text.substring(delRange);
      const newAdd = add(row, posAdd + delRange, newText);
      compressionObj = getCompressionObj(newAdd, null);
    }
    // the del starts before the add
    else {
      const overlap = posDel + delRange - posAdd;
      const newText = text.substring(overlap);
      const newAdd = add(row, posAdd + overlap, newText);
      const newDel = del(row, posDel, delRange - overlap);
      compressionObj = getCompressionObj(newAdd, newDel);
    }
  }
  // deleting from the right
  else if (posDel > posAdd && posDel < posAdd + text.length) {
    // the del and add end at the same position
    if (posAdd + text.length === posDel + delRange) {
      const newText = text.substring(0, text.length - delRange);
      const newAdd = add(row, posAdd, newText);
      compressionObj = getCompressionObj(newAdd, null);
    }
    // the del ends after the add
    else {
      const overlap = posAdd + text.length - posDel;
      const newText = text.substring(0, text.length - overlap);
      const newAdd = add(row, posAdd, newText);
      const newDel = del(row, posAdd + newText.length, delRange - overlap);
      compressionObj = getCompressionObj(newAdd, newDel);
    }
  }
  else {
    compressionObj = null;
  }

  return compressionObj;
}

function mergeSubdifs(dif) {
  let changeOccurred = true;
  while (changeOccurred) {
    changeOccurred = false;
    for (let i = 0; i < dif.length - 1; ++i) { // so that there is a next entry
      const first = dif[i];
      const second = dif[i + 1];
      let compressionObj = null;

      // merge adds together
      if (isAdd(first) && isAdd(second)) {
        compressionObj = addAddCompression(first, second);
      }
      // merge dels together
      else if (isDel(first) && isDel(second)) {
        compressionObj = delDelCompression(first, second);
      }
      // reduce adds followed by dels
      else if (isAdd(first) && isDel(second)) {
        compressionObj = addDelCompression(first, second);
      }

      if (compressionObj !== null) {
        changeOccurred = true;
        if (compressionObj.newFirst !== null && compressionObj.newSecond !== null) {
          dif[i] = compressionObj.newFirst;
          dif[i + 1] = compressionObj.newSecond;
          if (i > 0) {
            i -= 2; // move back so that the previous subdif can be compressed against the new add
          }
        }
        else if (compressionObj.newFirst !== null || compressionObj.newSecond !== null) {
          dif.splice(i, 1);
          dif[i] = (compressionObj.newFirst !== null
            ? compressionObj.newFirst
            : compressionObj.newSecond);
          i -= (i > 0 ? 2 : 1);
        }
        // both subdifs got removed
        else {
          dif.splice(i, 2);
          i -= 1;
        }
      }
    }
  }
}

/**
 * @brief Creates a new dif that has the same effects as the input dif but is compressed.
 * @param {*} inputDif The dif to be compressed.
 * @returns Compressed dif.
 */
function compress(inputDif) {
  const dif = deepCopy(inputDif);
  removeEmptySubdifs(dif);
  mergeSubdifs(dif);
  return dif;
}

module.exports = {
  compress,
};
