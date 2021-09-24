var to = require('../lib/dif');
var wrap;

beforeEach(() => {
    wrap = to.prim.wrapSubdif(to.add(0, 5, 'test'));
});

test('transformer on a different row', () => {
    let transformer = to.del(2, 5, 3);
    let expected_wrap = to.prim.deepCopy(wrap);
    let transformed_wrap = to.prim.IT_AD(wrap, transformer);
    expect(transformed_wrap).toEqual(expected_wrap);
});

test('transformer at the same position as the wrap', () => {
    let transformer = to.add(0, 5, 3);
    let expected_wrap = to.prim.deepCopy(wrap);
    let transformed_wrap = to.prim.IT_AD(wrap, transformer);
    expect(transformed_wrap).toEqual(expected_wrap);
});

test('wrap positioned after the transformer and its effective range', () => {
    let transformer = to.add(0, 1, 3);
    let expected_wrap = to.prim.wrapSubdif(to.add(0, 2, 'test'));
    let transformed_wrap = to.prim.IT_AD(wrap, transformer);
    expect(transformed_wrap).toEqual(expected_wrap);
});

test('wrap positioned inside the transformers effective range', () => {
    let transformer = to.add(0, 1, 6);
    let expected_wrap = to.prim.wrapSubdif(to.add(0, 1, 'test'));
    to.prim.saveLI(expected_wrap, to.prim.deepCopy(wrap.sub), transformer);
    let transformed_wrap = to.prim.IT_AD(wrap, transformer);
    expect(transformed_wrap).toEqual(expected_wrap);
});