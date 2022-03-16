var to = require('../lib/dif');

function testCompress(testName, inputDif, expected) {
  test(testName, () => {
    const result = to.compress(inputDif);
    expect(JSON.stringify(result)).toBe(JSON.stringify(expected));
  });
}

function testCompressArray(testArray) {
  testArray.forEach((test) => {
    testCompress(...test);
  });
}

const tests = [
  [
    'Empty subdifs get removed.',
    [to.add(1, 2, 0), to.del(1, 2, 0), to.add(0, 0, 'a'), to.move(0, 0, 0, 0, 0)],
    [to.add(0, 0, 'a')],
  ],
  [
    'Dif containing only empty subdifs returns an empty dif',
    [to.add(1, 2, 0), to.del(1, 2, 0), to.move(0, 0, 0, 0, 0)],
    [],
  ],
];

testCompressArray(tests);