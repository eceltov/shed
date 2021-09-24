var to = require('../lib/dif');
var wrap;

beforeEach(() => {
    wrap = to.prim.wrapSubdif(to.add(0, 5, 'test'));
});

test('transformer on a different row', () => {
    let transformer = to.add(2, 5, '1234');
    let expected_wrap = to.prim.deepCopy(wrap);
    let transformed_wrap = to.prim.IT_AA(wrap, transformer);
    expect(transformed_wrap).toEqual(expected_wrap);
});

test('transformer at the same position as the wrap', () => {
    let transformer = to.add(0, 5, '1234');
    let expected_wrap = to.prim.wrapSubdif(to.add(0, 9, 'test'));
    let transformed_wrap = to.prim.IT_AA(wrap, transformer);
    expect(transformed_wrap).toEqual(expected_wrap);
});

test('transformer positioned before the wrap', () => {
    let transformer = to.add(0, 4, '1234');
    let expected_wrap = to.prim.wrapSubdif(to.add(0, 9, 'test'));
    let transformed_wrap = to.prim.IT_AA(wrap, transformer);
    expect(transformed_wrap).toEqual(expected_wrap);
});