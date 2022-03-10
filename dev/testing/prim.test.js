var to = require('../lib/dif');

function indepDep(dif) {
  const wiDif = to.prim.makeIndependant(to.prim.wrapDif(dif));
  const wdDif = to.prim.makeDependant(wiDif);
  const dif2 = to.prim.unwrapDif(wdDif);
  return dif2;
}

function depIndep(dif) {
  const wiDif = to.prim.makeDependant(to.prim.wrapDif(dif));
  const wdDif = to.prim.makeIndependant(wiDif);
  const dif2 = to.prim.unwrapDif(wdDif);
  return dif2;
}

function wrappedLIT(dif, transformer) {
  const wiDif = to.prim.makeIndependant(to.prim.wrapDif(dif));
  const wTransformer = to.prim.wrapDif(transformer);
  const wTransformed = to.prim.LIT(wiDif, wTransformer);
  const transformed = to.prim.unwrapDif(wTransformed);
  return transformed;
}

test('LIT does not change its parameters.', () => {
  const dif = [to.del(1, 1, 1)];
  const transformer = [to.newline(0)];
  const wDif = to.prim.wrapDif(dif);
  const wTransformer = to.prim.wrapDif(transformer);
  const wDifBeforeString = JSON.stringify(wDif);
  to.prim.LIT(wDif, wTransformer);
  const wDifAfterString = JSON.stringify(wDif);
  expect(wDifBeforeString).toBe(wDifAfterString);
});

test('LET does not change its parameters.', () => {
  const dif = [to.del(1, 1, 1)];
  const transformer = [to.newline(0)];
  const wDif = to.prim.wrapDif(dif);
  const wTransformer = to.prim.wrapDif(transformer);
  const wDifBeforeString = JSON.stringify(wDif);
  to.prim.LET(wDif, wTransformer);
  const wDifAfterString = JSON.stringify(wDif);
  expect(wDifBeforeString).toBe(wDifAfterString);
});

test('Including an unrelated dif to a dif starting with newline will not change the original.', () => {
  const dif = [to.newline(1), to.del(1, 1, 1)];
  const transformer = [to.newline(5)];
  const wiDif = to.prim.makeIndependant(to.prim.wrapDif(dif));
  const wTransformer = to.prim.wrapDif(transformer);
  const wTransformed = to.prim.LIT(wiDif, wTransformer);
  const transformed = to.prim.unwrapDif(wTransformed);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(transformed));
});

test('Making a dif [add, add, add] independant and then dependant is an identity 1.', () => {
  const dif = [to.add(0, 0, 'a'), to.add(0, 1, 'bc'), to.add(0, 3, 'defg')];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [add, add, add] independant and then dependant is an identity 2.', () => {
  const dif = [to.add(0, 0, 'a'), to.add(0, 0, 'bc'), to.add(0, 0, 'defg')];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [add, add, add] independant and then dependant is an identity 3.', () => {
  const dif = [to.add(0, 0, 'a'), to.add(0, 0, 'bc'), to.add(0, 1, 'defg')];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [add, del, add, del] independant and then dependant is an identity 1.', () => {
  const dif = [to.add(0, 0, 'abcd'), to.del(0, 1, 2), to.add(0, 2, 'ef'), to.del(0, 1, 2)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});


test('Making a dif [add, del, add, del] independant and then dependant is an identity 2.', () => {
  const dif = [to.add(0, 0, 'abcd'), to.del(0, 1, 2), to.add(0, 1, 'bc'), to.del(0, 0, 4)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});


test('Making a dif [add, del, add, del] independant and then dependant is an identity 3.', () => {
  const dif = [to.add(0, 0, 'abcd'), to.del(0, 0, 4), to.add(0, 0, 'abcd'), to.del(0, 0, 4)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});


test('Making a dif [add, del, add, del] independant and then dependant is an identity 4.', () => {
  const dif = [to.add(0, 0, 'abcd'), to.del(0, 1, 2), to.add(0, 0, 'abcd'), to.del(0, 1, 4)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, del] independant and then dependant is an identity 1.', () => {
  const dif = [to.newline(0), to.del(1, 1, 1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, del] independant and then dependant is an identity 2.', () => {
  const dif = [to.newline(1), to.del(1, 1, 1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, del] independant and then dependant is an identity 3.', () => {
  const dif = [to.newline(2), to.del(1, 1, 1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 1.', () => {
  const dif = [to.newline(0), to.newline(0), to.newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 2.', () => {
  const dif = [to.newline(0), to.newline(1), to.newline(2)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 3.', () => {
  const dif = [to.newline(2), to.newline(1), to.newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 4.', () => {
  const dif = [to.newline(1), to.newline(1), to.newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 5.', () => {
  const dif = [to.newline(2), to.newline(1), to.newline(2)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 6.', () => {
  const dif = [to.newline(1), to.newline(2), to.newline(1)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Making a dif [newline, newline, newline] independant and then dependant is an identity 7.', () => {
  const dif = [to.newline(2), to.newline(2), to.newline(0)];
  const dif2 = indepDep(dif);
  expect(JSON.stringify(dif)).toBe(JSON.stringify(dif2));
});

test('Including [add] to [add] 1.', () => {
  const dif = [to.add(0, 1, 'a')];
  const transformer = [to.add(0, 0, 'b')];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 2, 'a')]; // 'b' was inserted before 'a'
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [add] to [add] 2.', () => {
  const dif = [to.add(0, 0, 'a')];
  const transformer = [to.add(0, 1, 'b')];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 0, 'a')]; // 'b' was inserted after 'a'
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [add] to [add] 3.', () => {
  const dif = [to.add(0, 0, 'a')];
  const transformer = [to.add(0, 0, 'b')];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 1, 'a')]; // 'b' was inserted before 'a'
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [del] to [add] 1.', () => {
  const dif = [to.add(0, 3, 'a')];
  const transformer = [to.del(0, 0, 1)];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 2, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [del] to [add] 2.', () => {
  const dif = [to.add(0, 3, 'a')];
  const transformer = [to.del(0, 1, 5)];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 1, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [del] to [add] 3.', () => {
  const dif = [to.add(0, 3, 'a')];
  const transformer = [to.del(0, 0, 5)];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 0, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [del] to [add] 4.', () => {
  const dif = [to.add(0, 3, 'a')];
  const transformer = [to.del(0, 3, 1)];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 3, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});

test('Including [del] to [add] 5.', () => {
  const dif = [to.add(0, 3, 'a')];
  const transformer = [to.del(0, 4, 1)];
  const transformed = wrappedLIT(dif, transformer);
  const expected = [to.add(0, 3, 'a')];
  expect(JSON.stringify(transformed)).toBe(JSON.stringify(expected));
});


/*test('Clients can connect to the server', () => {
  const wDif = to.prim.wrapDif([1, [0, 5, 1, 0, 11]]);
  const wTransformer = to.prim.wrapDif([1, [0, 12, 1, 0, 4]]);
  const wTransformed = to.prim.LIT(wDif, wTransformer, true);
  console.log(JSON.stringify(wTransformed));
  // const wExcluded = to.prim.LET(wTransformed, wTransformer);
  // console.log(JSON.stringify(wExcluded));
});*/