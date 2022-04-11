const { makeDependant, makeIndependant, LIT, LET } = require('../lib/dif');
const { add, del, move, newline, remline, wrapDif, unwrapDif, wrapSubdif, unwrapSubdif } = require('../lib/subdifOps');
const { createMetaArr, testLITArray, testLETArray } = require('./primTestingLib');

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
});

/*test('Clients can connect to the server', () => {
  const wDif = wrapDif([1, [0, 5, 1, 0, 11]]);
  const wTransformer = wrapDif([1, [0, 12, 1, 0, 4]]);
  const wTransformed = LIT(wDif, wTransformer, true);
  console.log(JSON.stringify(wTransformed));
  // const wExcluded = LET(wTransformed, wTransformer);
  // console.log(JSON.stringify(wExcluded));
});*/



