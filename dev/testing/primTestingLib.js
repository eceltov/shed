const { makeDependant, makeIndependant, LIT, LET } = require('../lib/dif');
const { add, del, move, newline, remline, wrapDif, unwrapDif, wrapSubdif, unwrapSubdif } = require('../lib/subdifOps');

function createMetaObj(
  dif, wTransformer, informationLost = undefined, relative = undefined, originalIndex = undefined,
  transformerIndex = undefined, addresser = undefined, siblings = undefined, ID = undefined,
) {
  return {
    ID: ID,
    informationLost: informationLost, // whether the context had to be saved
    relative: relative, // whether relative addresing is in place
    context: {
      original: isNaN(originalIndex) ? undefined : dif[originalIndex],
      wTransformer: isNaN(transformerIndex) ? undefined : wTransformer[transformerIndex],
      addresser: addresser,
      siblings: siblings, // the wrap IDs of right siblings if fragmented
    },
  };
}

function createMetaArr(
  informationLost = undefined, relative = undefined, originalIndex = undefined,
  transformerIndex = undefined, addresser = undefined, siblings = undefined, ID = undefined,
) {
  return [
    informationLost, relative, originalIndex, transformerIndex, addresser, siblings, ID,
  ];
}

function assertMetaEqual(wTransformed, metaArr = null) {
  if (metaArr === null) {
    for (let i = 0; i < wTransformed.length; i++) {
      expect(wTransformed[i].meta.informationLost).toBe(false);
      expect(wTransformed[i].meta.relative).toBe(false);
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
function expandMetaArr(dif, wTransformer, metaArr) {
  let expandedMetaArr = [];
  metaArr.forEach((array) => {
    expanded = createMetaObj(dif, wTransformer, ...array);
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
      const expandedMetaArr = expandMetaArr(dif, wTransformer, metaArr);
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
      const expandedMetaArr = expandMetaArr(dif, wTransformer, metaArr);
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
    const expandedMetaArr = expandMetaArr(dif, wTransformer, metaArr);
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
  DEBUGAssertEqual(JSON.stringify(transformed)).toBe(JSON.stringify(expected));

  if (metaArr !== null) {
    const expandedMetaArr = expandMetaArr(dif, wTransformer, metaArr);
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

module.exports = {
  createMetaArr, testLITArray, testLETArray, DEBUGTestLITArray, DEBUGTestLETArray,
};
