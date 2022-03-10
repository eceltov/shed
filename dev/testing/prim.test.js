var to = require('../lib/dif');

test('LIT does not change its parameters.', () => {
  const wDif = to.prim.wrapDif([1, 1, 1]);
  const wTransformer = to.prim.wrapDif([0]);
  const wDifBeforeString = JSON.stringify(wDif);
  to.prim.LIT(wDif, wTransformer);
  const wDifAfterString = JSON.stringify(wDif);
  expect(wDifBeforeString).toBe(wDifAfterString);
});

test('LET does not change its parameters.', () => {
  const wDif = to.prim.wrapDif([1, 1, 1]);
  const wTransformer = to.prim.wrapDif([0]);
  const wDifBeforeString = JSON.stringify(wDif);
  to.prim.LET(wDif, wTransformer);
  const wDifAfterString = JSON.stringify(wDif);
  expect(wDifBeforeString).toBe(wDifAfterString);
});
