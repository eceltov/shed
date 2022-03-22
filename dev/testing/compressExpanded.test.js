var to = require('../lib/dif');

/*
dependant: [to.del(0, 3, 1), to.del(0, 1, 5)],
will get first transformed to (LET):
independant: [to.del(0, 1, 2), to.del(0, 3, 1), to.del(0, 4, 3)]
dependant: [to.del(0, 1, 2), to.del(0, 1, 1), to.del(0, 1, 3)]
compressed: [to.del(0, 1, 6)]
*/

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
    'subdifs get reordered correctly 1',
    [to.add(0, 2, 'b'), to.add(0, 0, 'a')],
    [to.add(0, 0, 'a'), to.add(0, 3, 'b')],
  ],
  [
    '[add, add, add] gets compressed and transformed correctly 1',
    [to.add(0, 0, 'abc'), to.add(0, 10, 'fg'), to.add(0, 3, 'de')],
    [to.add(0, 0, 'abcde'), to.add(0, 12, 'fg')],
  ],
  [
    '[add, add, add] gets compressed and transformed correctly 2',
    [to.add(0, 0, 'cde'), to.add(0, 10, 'fg'), to.add(0, 0, 'ab')],
    [to.add(0, 0, 'abcde'), to.add(0, 12, 'fg')],
  ],
  [
    '[add, add, add] gets compressed and transformed correctly 3',
    [to.add(0, 0, 'abc'), to.add(0, 4, 'fg'), to.add(0, 3, 'de')],
    [to.add(0, 0, 'abcde'), to.add(0, 6, 'fg')],
  ],
  [
    '[del, del, del] gets compressed and transformed correctly 1',
    [to.del(0, 0, 1), to.del(0, 5, 1), to.del(0, 0, 1)],
    [to.del(0, 0, 2), to.del(0, 4, 1)],
  ],
  [
    '[del, del, del] gets compressed and transformed correctly 2',
    [to.del(0, 0, 1), to.del(0, 2, 1), to.del(0, 0, 1)],
    [to.del(0, 0, 2), to.del(0, 3, 1)],
  ],
  [
    '[del, del, del] gets compressed and transformed correctly 3',
    [to.del(0, 5, 1), to.del(0, 1, 1), to.del(0, 4, 1)],
    [to.del(0, 1, 1), to.del(0, 4, 2)],
  ],
];

testCompressArray(tests);