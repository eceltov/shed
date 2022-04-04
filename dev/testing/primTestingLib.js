const { makeDependant, makeIndependant, LIT, LET } = require('../lib/dif');
const { add, del, move, newline, remline, wrapDif, unwrapDif, wrapSubdif, unwrapSubdif } = require('../lib/subdifOps');
const { joinSiblings } = require('../lib/metaOps');

function createMetaObj(
  dif, wTransformer, wTransformed, informationLost = undefined, relative = undefined, originalIndex = undefined,
  transformerIndex = undefined, addresserIndex = undefined, siblingIndices = undefined, ID = undefined,
) {
  let siblings = undefined;
  if (siblingIndices !== undefined) {
    siblings = [];
    siblingIndices.forEach((index) => {
      siblings.push(wTransformed[index].meta.ID);
    });
  }
  return {
    ID: ID,
    informationLost: informationLost, // whether the context had to be saved
    relative: relative, // whether relative addresing is in place
    context: {
      original: isNaN(originalIndex) ? undefined : dif[originalIndex],
      wTransformer: isNaN(transformerIndex) ? undefined : wTransformer[transformerIndex],
      addresser: isNaN(addresserIndex) ? undefined : wTransformer[addresserIndex],
      siblings: siblings,
    },
  };
}

/**
 * @param {boolean} informationLost meta.informationLost
 * @param {boolean} relative meta.relative
 * @param {number} originalIndex The index of meta.context.original inside the start dif
 * @param {number} transformerIndex The index of meta.context.wTransformer inside the transformer dif
 * @param {number} addresserIndex The index of meta.context.addresser inside the transformer dif
 * @param {number[]} siblingIndices The indices of siblings inside the expected dif
 * @param {number} ID The ID of the subdif
 * @returns Returns an array representing the meta state of a subdif.
 */
function createMetaArr(
  informationLost = undefined, relative = undefined, originalIndex = undefined,
  transformerIndex = undefined, addresserIndex = undefined, siblingIndices = undefined, ID = undefined,
) {
  return [
    informationLost, relative, originalIndex, transformerIndex, addresserIndex, siblingIndices, ID,
  ];
}

function assertMetaEqual(wTransformed, metaArr = null) {
  if (metaArr === null) {
    for (let i = 0; i < wTransformed.length; i++) {
      expect(wTransformed[i].meta.informationLost).toBe(false);
      expect(wTransformed[i].meta.relative).toBe(false);
      expect(wTransformed[i].meta.context.original).toBe(null);
      expect(wTransformed[i].meta.context.wTransformer).toBe(null);
      expect(wTransformed[i].meta.context.addresser).toBe(null);
      expect(wTransformed[i].meta.context.siblings.length).toBe(0);
    }
  }
  else {
    expect(wTransformed.length === metaArr.length);
    for (let i = 0; i < wTransformed.length; i++) {
      if (metaArr[i].informationLost !== undefined) 
        expect(wTransformed[i].meta.informationLost).toBe(metaArr[i].informationLost);
      if (metaArr[i].relative !== undefined) 
        expect(wTransformed[i].meta.relative).toBe(metaArr[i].relative);
      if (metaArr[i].context !== undefined) {
        if (metaArr[i].context.original !== undefined)
          expect(JSON.stringify(wTransformed[i].meta.context.original)).toBe(JSON.stringify(metaArr[i].context.original));
        if (metaArr[i].context.wTransformer !== undefined)
          expect(JSON.stringify(wTransformed[i].meta.context.wTransformer)).toBe(JSON.stringify(metaArr[i].context.wTransformer));
        if (metaArr[i].context.addresser !== undefined) 
          expect(JSON.stringify(wTransformed[i].meta.context.addresser)).toBe(JSON.stringify(metaArr[i].context.addresser));
        if (metaArr[i].context.siblings !== undefined) 
          expect(JSON.stringify(wTransformed[i].meta.context.siblings)).toBe(JSON.stringify(metaArr[i].context.siblings));
      }
    }
  }
}

// expand each array element into a meta object
function expandMetaArr(dif, wTransformer, wTransformed, metaArr) {
  let expandedMetaArr = [];
  metaArr.forEach((array) => {
    expanded = createMetaObj(dif, wTransformer, wTransformed, ...array);
    expandedMetaArr.push(expanded);
  });
  return expandedMetaArr;    
}

// metaArr is an array of arrays
function testLIT(testName, dif, transformer, expected, metaArr = null) {
  test(testName, () => {
    const wiDif = makeIndependant(wrapDif(dif));
    const wTransformer = wrapDif(transformer);
    const wTransformed = LIT(wiDif, wTransformer);
    const transformed = unwrapDif(wTransformed);
    expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));

    if (metaArr !== null) {
      const expandedMetaArr = expandMetaArr(dif, wTransformer, wTransformed, metaArr);
      assertMetaEqual(wTransformed, expandedMetaArr);
    }
    else {
      assertMetaEqual(wTransformed);
    }
  });
}

function testLITArray(testArray) {
  testArray.forEach((test) => {
    testLIT(...test);
  });
}

function testLET(testName, dif, transformer, expected, metaArr = null) {
  test(testName, () => {
    const wiDif = makeIndependant(wrapDif(dif));
    const wTransformer = wrapDif(transformer);
    const wTransformed = LET(wiDif, wTransformer);
    const transformed = unwrapDif(wTransformed);
    expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));

    if (metaArr !== null) {
      const expandedMetaArr = expandMetaArr(dif, wTransformer, wTransformed, metaArr);
      assertMetaEqual(wTransformed, expandedMetaArr);
    }
    else {
      assertMetaEqual(wTransformed);
    }
  });
}

function testLETArray(testArray) {
  testArray.forEach((test) => {
    testLET(...test);
  });
}

function testIndependance(testName, dif, expected, metaArr = null) {
  test(testName, () => {
    const wiDif = makeIndependant(wrapDif(dif));
    const result = unwrapDif(wiDif);
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));

    if (metaArr !== null) {
      const expandedMetaArr = expandMetaArr(dif, null, wiDif, metaArr);
      assertMetaEqual(wiDif, expandedMetaArr);
    }
    else {
      assertMetaEqual(wiDif);
    }
  });
}

function testIndepArray(testArray) {
  testArray.forEach((test) => {
    testIndependance(...test);
  });
}

function testIndepDep(testName, dif, metaArr = null) {
  test(testName, () => {
    const wiDif = makeIndependant(wrapDif(dif));
    const wdDif = makeDependant(wiDif);
    /// TODO add joinSiblings to the actual implementation
    const wdJoinedDif = joinSiblings(wdDif);
    const result = unwrapDif(wdJoinedDif);
    expect(JSON.stringify(result)).toBe(JSON.stringify(dif));

    if (metaArr !== null) {
      const expandedMetaArr = expandMetaArr(dif, null, wdJoinedDif, metaArr);
      assertMetaEqual(wdJoinedDif, expandedMetaArr);
    }
    else {
      assertMetaEqual(wdJoinedDif);
    }
  });
}

function testIndepDepArray(testArray) {
  testArray.forEach((test) => {
    testIndepDep(...test);
  });
}

function DEBUGAssertEqual(received, expected, errMsg) {
  if (JSON.stringify(received) !== JSON.stringify(expected)) {
    console.log(errMsg);
    console.log('Expected: ', expected);
    console.log('Received: ', received);
    console.log();
  }
}

function DEBUGAssertMetaEqual(wTransformed, metaArr = null) {
  if (metaArr === null) {
    for (let i = 0; i < wTransformed.length; i++) {
      DEBUGAssertEqual(wTransformed[i].meta.informationLost, false, 'Information lost mismatch');
      DEBUGAssertEqual(wTransformed[i].meta.relative, false, 'Relative mismatch');
    }
  }
  else {
    DEBUGAssertEqual(wTransformed.length, metaArr.length, 'Length mismatch');
    for (let i = 0; i < wTransformed.length; i++) {
      if (metaArr[i].informationLost !== undefined) 
        DEBUGAssertEqual(wTransformed[i].meta.informationLost, metaArr[i].informationLost, 'Information lost mismatch');
      if (metaArr[i].relative !== undefined) 
        DEBUGAssertEqual(wTransformed[i].meta.relative, metaArr[i].relative, 'Relative mismatch');
      if (metaArr[i].context !== undefined) {
        if (metaArr[i].context.original !== undefined)
          DEBUGAssertEqual(wTransformed[i].meta.context.original, metaArr[i].context.original, 'Original mismatch');
        if (metaArr[i].context.wTransformer !== undefined)
          DEBUGAssertEqual(wTransformed[i].meta.context.wTransformer, metaArr[i].context.wTransformer, 'wTransformer mismatch');
        if (metaArr[i].context.addresser !== undefined) 
          DEBUGAssertEqual(wTransformed[i].meta.context.addresser, metaArr[i].context.addresser, 'Addresser mismatch');
        if (metaArr[i].context.siblings !== undefined) 
          DEBUGAssertEqual(wTransformed[i].meta.context.siblings, metaArr[i].context.siblings, 'Siblings mismatch');
      }
    }
  }
}

// metaArr is an array of arrays
function DEBUGTestLIT(testName, dif, transformer, expected, metaArr = null) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wTransformer = wrapDif(transformer);
  const wTransformed = LIT(wiDif, wTransformer);
  const transformed = unwrapDif(wTransformed);
  DEBUGAssertEqual(transformed, expected, 'Unexpected result');

  if (metaArr !== null) {
    const expandedMetaArr = expandMetaArr(dif, wTransformer, wTransformed, metaArr);
    DEBUGAssertMetaEqual(wTransformed, expandedMetaArr);
  }
  else {
    DEBUGAssertMetaEqual(wTransformed);
  }
}

function DEBUGTestLITArray(testArray) {
  testArray.forEach((test) => {
    DEBUGTestLIT(...test);
  });
}

function DEBUGTestLET(testName, dif, transformer, expected, metaArr = null) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wTransformer = wrapDif(transformer);
  const wTransformed = LET(wiDif, wTransformer);
  const transformed = unwrapDif(wTransformed);
  DEBUGAssertEqual(transformed, expected, 'Unexpected result');

  if (metaArr !== null) {
    const expandedMetaArr = expandMetaArr(dif, wTransformer, wTransformed, metaArr);
    DEBUGAssertMetaEqual(wTransformed, expandedMetaArr);
  }
  else {
    DEBUGAssertMetaEqual(wTransformed);
  }
}

function DEBUGTestLETArray(testArray) {
  testArray.forEach((test) => {
    DEBUGTestLET(...test);
  });
}

function DEBUGTestIndepDep(testName, dif, metaArr = null) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wdDif = makeDependant(wiDif);
  /// TODO add joinSiblings to the actual implementation
  const wdJoinedDif = joinSiblings(wdDif);
  const result = unwrapDif(wdJoinedDif);
  DEBUGAssertEqual(result, dif, 'Unexpected result');

  if (metaArr !== null) {
    const expandedMetaArr = expandMetaArr(dif, null, wdJoinedDif, metaArr);
    DEBUGAssertMetaEqual(wdJoinedDif, expandedMetaArr);
  }
  else {
    DEBUGAssertMetaEqual(wdJoinedDif);
  }
}

function DEBUGTestIndepDepArray(testArray) {
  testArray.forEach((test) => {
    DEBUGTestIndepDep(...test);
  });
}

module.exports = {
  createMetaArr, testLITArray, testLETArray, DEBUGTestLITArray, DEBUGTestLETArray, testIndepArray, testIndepDepArray, DEBUGTestIndepDepArray,
};
