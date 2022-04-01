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

// metaArr is an array of arrays
function testLIT(testName, dif, transformer, expected, metaArr = null) {
  test(testName, () => {
    const wiDif = makeIndependant(wrapDif(dif));
    const wTransformer = wrapDif(transformer);
    const wTransformed = LIT(wiDif, wTransformer);
    const transformed = unwrapDif(wTransformed);
    expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));

    if (metaArr !== null) {
      // expand each array element into a meta object
      let expandedMetaArr = [];
      metaArr.forEach((array) => {
        expanded = createMetaObj(dif, wTransformer, ...array);
        expandedMetaArr.push(expanded);
      });
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
    const wTransformed = compositeLETWrapped(dif, transformer);
    const transformed = unwrapDif(wTransformed);
    expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
    assertMetaEqual(wTransformed, metaArr);
  });
}

function testLETArray(testArray) {
  testArray.forEach((test) => {
    testLIT(...test);
  });
}

function indepDep(dif) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wdDif = makeDependant(wiDif);
  const dif2 = unwrapDif(wdDif);
  return dif2;
}

function depIndep(dif) {
  const wiDif = makeDependant(wrapDif(dif));
  const wdDif = makeIndependant(wiDif);
  const dif2 = unwrapDif(wdDif);
  return dif2;
}

function compositeLITWrapped(dif, transformer) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wTransformer = wrapDif(transformer);
  const wTransformed = LIT(wiDif, wTransformer);
  return wTransformed;
}

function compositeLIT(dif, transformer) {
  const wTransformed = compositeLITWrapped(dif, transformer);
  const transformed = unwrapDif(wTransformed);
  return transformed;
}

function compositeLETWrapped(dif, transformer) {
  const wiDif = makeIndependant(wrapDif(dif));
  const wTransformer = wrapDif(transformer);
  const wTransformed = LET(wiDif, wTransformer);
  return wTransformed;
}

function compositeLET(dif, transformer) {
  const wiTransformed = compositeLETWrapped(dif, transformer);
  const wdTransformed = makeDependant(wiTransformed);
  const transformed = unwrapDif(wdTransformed);
  return transformed;
}
/*
test('Sibling joining 1.', () => {
  const subdif1 = del(0, 1, 1);
  const subdif2 = del(0, 1, 2);
  const wrap1 = wrapSubdif(subdif1);
  const wrap2 = wrapSubdif(subdif2);
  const wDif = [wrap1, wrap2];
  to.prim.saveSibling(wrap1, wrap2);
  const wJoinedDif = to.prim.joinSiblings(wDif);
  expect(wJoinedDif.length).toBe(1);
  expect(JSON.stringify(wJoinedDif[0].sub)).toBe(JSON.stringify([del(0, 1, 3)]));
});

test('LIT does not change its parameters.', () => {
  const dif = [del(1, 1, 1)];
  const transformer = [newline(0)];
  const wDif = wrapDif(dif);
  const wTransformer = wrapDif(transformer);
  const wDifBeforeString = JSON.stringify(wDif);
  LIT(wDif, wTransformer);
  const wDifAfterString = JSON.stringify(wDif);
  expect(wDifBeforeString).toBe(wDifAfterString);
});

test('LET does not change its parameters.', () => {
  const dif = [del(1, 1, 1)];
  const transformer = [newline(0)];
  const wDif = wrapDif(dif);
  const wTransformer = wrapDif(transformer);
  const wDifBeforeString = JSON.stringify(wDif);
  LET(wDif, wTransformer);
  const wDifAfterString = JSON.stringify(wDif);
  expect(wDifBeforeString).toBe(wDifAfterString);
});

test('Including an unrelated dif to a dif starting with newline will not change the original.', () => {
  const dif = [newline(1), del(1, 1, 1)];
  const transformer = [newline(5)];
  const wiDif = makeIndependant(wrapDif(dif));
  const wTransformer = wrapDif(transformer);
  const wTransformed = LIT(wiDif, wTransformer);
  const transformed = unwrapDif(wTransformed);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(transformed));
});

test('Making a dif [add, add, add] independant and then dependant is an identity 1.', () => {
  const dif = [add(0, 0, 'a'), add(0, 1, 'bc'), add(0, 3, 'defg')];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [add, add, add] independant and then dependant is an identity 2.', () => {
  const dif = [add(0, 0, 'a'), add(0, 0, 'bc'), add(0, 0, 'defg')];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [add, add, add] independant and then dependant is an identity 3.', () => {
  const dif = [add(0, 0, 'a'), add(0, 0, 'bc'), add(0, 1, 'defg')];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [add, del, add, del] independant and then dependant is an identity 1.', () => {
  const dif = [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 2, 'ef'), del(0, 1, 2)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});


test('Making a dif [add, del, add, del] independant and then dependant is an identity 2.', () => {
  const dif = [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 1, 'bc'), del(0, 0, 4)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});


test('Making a dif [add, del, add, del] independant and then dependant is an identity 3.', () => {
  const dif = [add(0, 0, 'abcd'), del(0, 0, 4), add(0, 0, 'abcd'), del(0, 0, 4)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});


test('Making a dif [add, del, add, del] independant and then dependant is an identity 4.', () => {
  const dif = [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 0, 'abcd'), del(0, 1, 4)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, del] independant and then dependant is an identity 1.', () => {
  const dif = [newline(0), del(1, 1, 1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, del] independant and then dependant is an identity 2.', () => {
  const dif = [newline(1), del(1, 1, 1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, del] independant and then dependant is an identity 3.', () => {
  const dif = [newline(2), del(1, 1, 1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 1.', () => {
  const dif = [newline(0), newline(0), newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 2.', () => {
  const dif = [newline(0), newline(1), newline(2)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 3.', () => {
  const dif = [newline(2), newline(1), newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 4.', () => {
  const dif = [newline(1), newline(1), newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 5.', () => {
  const dif = [newline(2), newline(1), newline(2)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 6.', () => {
  const dif = [newline(1), newline(2), newline(1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 7.', () => {
  const dif = [newline(2), newline(2), newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});



test('Excluding [add] from [add] 1.', () => {
  const dif = [add(0, 1, 'a')];
  const transformer = [add(0, 0, 'b')];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 0, 'a')]; // 'b' was inserted before 'a'
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [add] from [add] 2.', () => {
  const dif = [add(0, 0, 'a')];
  const transformer = [add(0, 1, 'b')];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 0, 'a')]; // 'b' was inserted after 'a'
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [add] from [add] 3.', () => {
  const dif = [add(0, 0, 'a')];
  const transformer = [add(0, 0, 'b')];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 0, 'a')];
  ///TODO: there might be some lost information going on here, test I/E on this example
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [add] 1.', () => {
  const dif = [add(0, 3, 'a')];
  const transformer = [del(0, 0, 1)];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 4, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [add] 2.', () => {
  const dif = [add(0, 3, 'a')];
  const transformer = [del(0, 1, 5)];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 8, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [add] 3.', () => {
  const dif = [add(0, 3, 'a')];
  const transformer = [del(0, 0, 5)];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 8, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [add] 4.', () => {
  const dif = [add(0, 3, 'a')];
  const transformer = [del(0, 3, 1)];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 3, 'a')]; ///TODO: should this be (0, 3, 'a') or (0, 4, 'a')?
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [add] 5.', () => {
  const dif = [add(0, 3, 'a')];
  const transformer = [del(0, 4, 1)];
  const transformed = compositeLET(dif, transformer);
  const expected = [add(0, 3, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [add] from [del] 1.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [add(0, 0, 'a')];
  const transformed = compositeLET(dif, transformer);
  const expected = [del(0, 2, 3)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [add] from [del] 2.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [add(0, 3, 'a')];
  const transformed = compositeLET(dif, transformer);
  const expected = [del(0, 3, 2)]; ///TODO: the lost information should be checked
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [add] from [del] 3.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [add(0, 4, 'a')];
  const wTransformed = compositeLETWrapped(dif, transformer);
  const transformed = unwrapDif(wTransformed);
  const expected = [del(0, 3, 1), del(0, 5, 1)]; ///TODO: check lost info, make I/E tests on this
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [add] from [del] 4.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [add(0, 6, 'a')];
  const transformed = compositeLET(dif, transformer);
  const expected = [del(0, 3, 3)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [add] from [del] 5.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [add(0, 7, 'a')];
  const transformed = compositeLET(dif, transformer);
  const expected = [del(0, 3, 3)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [del] 1.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 0, 1)];
  const transformed = compositeLET(dif, transformer);
  const expected = [del(0, 4, 3)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [del] 2.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 3, 1)];
  const wTransformed = compositeLETWrapped(dif, transformer);
  const transformed = unwrapDif(wTransformed);
  const expected = [del(0, 4, 3)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
  expect(wTransformed[0].meta.informationLost).toBe(false);
});

test('Excluding [del] from [del] 3.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 4, 1)];
  const transformed = compositeLET(dif, transformer);
  const expected = [del(0, 3, 1), del(0, 5, 2)]; ///TODO: check lost info, test I/E
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Excluding [del] from [del] 4.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 5, 1)];
  const wTransformed = compositeLETWrapped(dif, transformer);
  const transformed = unwrapDif(wTransformed);
  const expected = [del(0, 3, 2), del(0, 6, 1)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected)); ///TODO: check lost info
  //expect(wTransformed[0].meta.informationLost).toBe(true);
  //expect(JSON.stringify(wTransformed[0].meta.context.original)).toBe(JSON.stringify(dif[0]));
  //expect(JSON.stringify(wTransformed[0].meta.context.wTransformer.sub)).toBe(JSON.stringify(transformer[0]));
});

test('Excluding [del] from [del] 5.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 6, 1)];
  const transformed = compositeLET(dif, transformer);
  const expected = [del(0, 3, 3)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('I/E identity test [add] to/from [del] 1.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [add(0, 4, 'a')];
  const transformedLIT = compositeLET(dif, transformer);
  const expectedLIT = [del(0, 3, 1), del(0, 5, 2)];
  const transformedLET = compositeLET(transformedLIT, transformer);
  // the transformedLET is currently [[0,3,1],[0,4,2]], which has the same effect as the original
  // dif, but still is not equal.
  ///TODO: solve this

  expect(JSON.stringify(transformedLIT)).toBe(JSON.stringify(expectedLIT));
  expect(JSON.stringify(transformedLET)).toBe(JSON.stringify(dif));
});*/

/*test('Clients can connect to the server', () => {
  const wDif = wrapDif([1, [0, 5, 1, 0, 11]]);
  const wTransformer = wrapDif([1, [0, 12, 1, 0, 4]]);
  const wTransformed = LIT(wDif, wTransformer, true);
  console.log(JSON.stringify(wTransformed));
  // const wExcluded = LET(wTransformed, wTransformer);
  // console.log(JSON.stringify(wExcluded));
});*/

const testsLIT = [
  [
    'Including [add] to [add] 1.',
    [add(0, 1, 'a')],
    [add(0, 0, 'b')],
    [add(0, 2, 'a')], // 'b' was inserted before 'a'
  ],
  [
    'Including [add] to [add] 2.',
    [add(0, 0, 'a')],
    [add(0, 1, 'b')],
    [add(0, 0, 'a')], // 'b' was inserted after 'a'
  ],
  [
    'Including [add] to [add] 3.',
    [add(0, 0, 'a')],
    [add(0, 0, 'b')],
    [add(0, 1, 'a')], // 'b' was inserted before 'a'
  ],
  [
    'Including [del] to [add] 1.',
    [add(0, 3, 'a')],
    [del(0, 0, 1)],
    [add(0, 2, 'a')],
  ],
  [
    'Including [del] to [add] 2.',
    [add(0, 3, 'a')],
    [del(0, 1, 5)],
    [add(0, 1, 'a')],
  ],
  [
    'Including [del] to [add] 3.',
    [add(0, 3, 'a')],
    [del(0, 0, 5)],
    [add(0, 0, 'a')],
  ],
  [
    'Including [del] to [add] 4.',
    [add(0, 3, 'a')],
    [del(0, 3, 1)],
    [add(0, 3, 'a')],
  ],
  [
    'Including [del] to [add] 5.',
    [add(0, 3, 'a')],
    [del(0, 4, 1)],
    [add(0, 3, 'a')],
  ],
  [
    'Including [add] to [del] 1.',
    [del(0, 3, 3)],
    [add(0, 0, 'a')],
    [del(0, 4, 3)],
  ],
  [
    'Including [add] to [del] 2.',
    [del(0, 3, 3)],
    [add(0, 3, 'a')],
    [del(0, 4, 3)],
  ],
  [
    'Including [add] to [del] 3.',
    [del(0, 3, 3)],
    [add(0, 4, 'a')],
    [del(0, 3, 1), del(0, 5, 2)],
  ],
  [
    'Including [add] to [del] 4.',
    [del(0, 3, 3)],
    [add(0, 6, 'a')],
    [del(0, 3, 3)],
  ],
  [
    'Including [add] to [del] 5.',
    [del(0, 3, 3)],
    [add(0, 7, 'a')],
    [del(0, 3, 3)],
  ],
  [
    'Including [del] to [del] 1.',
    [del(0, 3, 3)],
    [del(0, 0, 1)],
    [del(0, 2, 3)],
  ],
  [
    'Including [del] to [del] 2.',
    [del(0, 3, 3)],
    [del(0, 3, 1)],
    [del(0, 3, 2)], // losing info
    [createMetaArr(true, false, 0, 0)],
  ],
];

testLITArray(testsLIT);

/*
test('Including [del] to [del] 2.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 3, 1)];
  const wTransformed = compositeLITWrapped(dif, transformer);
  const transformed = unwrapDif(wTransformed);
  const expected = [del(0, 3, 2)]; 
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
  expect(wTransformed[0].meta.informationLost).toBe(true);
  expect(JSON.stringify(wTransformed[0].meta.context.original)).toBe(JSON.stringify(dif[0]));
  expect(JSON.stringify(wTransformed[0].meta.context.wTransformer.sub)).toBe(JSON.stringify(transformer[0]));
});

test('Including [del] to [del] 3.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 4, 1)];
  const transformed = compositeLIT(dif, transformer);
  const expected = [del(0, 3, 2)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [del] to [del] 4.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 5, 1)];
  const wTransformed = compositeLITWrapped(dif, transformer);
  const transformed = unwrapDif(wTransformed);
  const expected = [del(0, 3, 2)]; // losing info
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
  expect(wTransformed[0].meta.informationLost).toBe(true);
  expect(JSON.stringify(wTransformed[0].meta.context.original)).toBe(JSON.stringify(dif[0]));
  expect(JSON.stringify(wTransformed[0].meta.context.wTransformer.sub)).toBe(JSON.stringify(transformer[0]));
});

test('Including [del] to [del] 5.', () => {
  const dif = [del(0, 3, 3)];
  const transformer = [del(0, 6, 1)];
  const transformed = compositeLIT(dif, transformer);
  const expected = [del(0, 3, 3)];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});
*/