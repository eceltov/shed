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
  [
    '[add, add] gets compressed correctly 1',
    [to.add(0, 0, 'a'), to.add(0, 1, 'bc')],
    [to.del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 2',
    [to.add(0, 0, 'ac'), to.add(0, 1, 'b')],
    [to.del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 3',
    [to.add(0, 0, 'c'), to.add(0, 0, 'ab')],
    [to.del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 4',
    [to.add(0, 1, 'c'), to.add(0, 0, 'ab')],
    [to.del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 5',
    [to.add(0, 2, 'c'), to.add(0, 0, 'ab')],
    [to.del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 6',
    [to.add(0, 3, 'c'), to.add(0, 0, 'ab')],
    [to.add(0, 3, 'c'), to.add(0, 0, 'ab')],
  ],
  [
    '[add, add] gets compressed correctly 7',
    [to.add(0, 0, 'a'), to.add(1, 1, 'bc')],
    [to.add(0, 0, 'a'), to.add(1, 1, 'bc')],
  ],
  [
    '[add, add, add] gets compressed correctly 1',
    [to.add(0, 0, 'a'), to.add(0, 1, 'b'), to.add(0, 2, 'c')],
    [to.add(0, 0, 'abc')],
  ],
  [
    '[add, add, add] gets compressed correctly 2',
    [to.add(0, 0, 'c'), to.add(0, 0, 'b'), to.add(0, 0, 'a')],
    [to.add(0, 0, 'abc')],
  ],
  [
    '[add, add, add] gets compressed correctly 3',
    [to.add(0, 0, 'adg'), to.add(0, 1, 'bc'), to.add(0, 4, 'ef')],
    [to.add(0, 0, 'abcdefg')],
  ],
  [
    '[add, add, add] gets compressed correctly 4',
    [to.add(0, 0, 'afg'), to.add(0, 1, 'be'), to.add(0, 2, 'cd')],
    [to.add(0, 0, 'abcdefg')],
  ],
  [
    '[add, add, add] gets compressed correctly 5',
    [to.add(0, 0, 'abc'), to.add(0, 3, 'fg'), to.add(0, 3, 'de')],
    [to.add(0, 0, 'abcdefg')],
  ],
  [
    '[add, add, add] gets compressed correctly 6',
    [to.add(0, 0, 'abe'), to.add(0, 3, 'fg'), to.add(0, 2, 'cd')],
    [to.add(0, 0, 'abcdefg')],
  ],
  [
    '[del, del] gets compressed correctly 1',
    [to.del(0, 0, 1), to.del(0, 1, 2)],
    // the second del is dependent on the first, it would have to be independant in order to be
    // compressed to to.del(0, 0, 3)
    [to.del(0, 0, 1), to.del(0, 1, 2)],
  ],
  [
    '[del, del] gets compressed correctly 2',
    [to.del(0, 0, 1), to.del(0, 0, 2)],
    [to.del(0, 0, 3)],
  ],
  [
    '[del, del] gets compressed correctly 3',
    [to.del(0, 1, 1), to.del(0, 1, 2)],
    [to.del(0, 1, 3)],
  ],
  [
    '[del, del] gets compressed correctly 4',
    [to.del(0, 2, 1), to.del(0, 1, 2)],
    [to.del(0, 1, 3)],
  ],
  [
    '[del, del] gets compressed correctly 5',
    [to.del(0, 2, 2), to.del(0, 1, 2)],
    [to.del(0, 1, 4)],
  ],
  [
    '[del, del] gets compressed correctly 6',
    [to.del(0, 2, 1), to.del(0, 3, 2)],
    [to.del(0, 2, 1), to.del(0, 3, 2)],
  ],
  [
    '[del, del] gets compressed correctly 7',
    [to.del(0, 2, 1), to.del(0, 4, 2)],
    [to.del(0, 2, 1), to.del(0, 4, 2)],
  ],
  [
    '[del, del] gets compressed correctly 8',
    [to.del(0, 4, 2), to.del(0, 2, 1)],
    [to.del(0, 4, 2), to.del(0, 2, 1)],
  ],
  [
    '[del, del] gets compressed correctly 9',
    [to.del(0, 4, 2), to.del(0, 2, 2)],
    [to.del(0, 2, 4)],
  ],
  [
    '[del, del] gets compressed correctly 10',
    [to.del(0, 0, 10), to.del(0, 1, 5)],
    [to.del(0, 0, 10), to.del(0, 1, 5)],
  ],
  [
    '[del, del] gets compressed correctly 11',
    [to.del(0, 0, 10), to.del(0, 5, 10)],
    [to.del(0, 0, 10), to.del(0, 5, 10)],
  ],
  [
    '[del, del] gets compressed correctly 12',
    [to.del(0, 1, 5), to.del(0, 0, 10)],
    [to.del(0, 0, 15)],
  ],
  [
    '[del, del] gets compressed correctly 13',
    [to.del(0, 5, 10), to.del(0, 0, 10)],
    [to.del(0, 0, 20)],
  ],
  [
    '[del, del] gets compressed correctly 14',
    [to.del(0, 5, 5), to.del(0, 0, 10)],
    [to.del(0, 0, 15)],
  ],
  [
    '[del, del, del] gets compressed correctly 1',
    [to.del(0, 0, 1), to.del(0, 1, 1), to.del(0, 2, 1)],
    [to.del(0, 0, 1), to.del(0, 1, 1), to.del(0, 2, 1)],
  ],
  [
    '[del, del, del] gets compressed correctly 2',
    [to.del(0, 0, 1), to.del(0, 0, 1), to.del(0, 0, 1)],
    [to.del(0, 0, 3)],
  ],
  [
    '[del, del, del] gets compressed correctly 3',
    [to.del(0, 0, 1), to.del(1, 0, 1), to.del(2, 0, 1)],
    [to.del(0, 0, 1), to.del(1, 0, 1), to.del(2, 0, 1)],
  ],
  [
    '[del, del, del] gets compressed correctly 4',
    [to.del(0, 0, 3), to.del(0, 1, 2), to.del(0, 0, 1)],
    [to.del(0, 0, 6)],
  ],
  [
    '[del, del, del] gets compressed correctly 5',
    [to.del(0, 2, 1), to.del(0, 1, 1), to.del(0, 0, 1)],
    [to.del(0, 0, 3)],
  ],
  [
    '[del, del, del] gets compressed correctly 6',
    [to.del(0, 0, 10), to.del(0, 3, 7), to.del(0, 5, 5)],
    [to.del(0, 0, 10), to.del(0, 3, 7), to.del(0, 5, 5)],
  ],
  [
    '[del, del, del] gets compressed correctly 7',
    [to.del(0, 0, 1), to.del(0, 2, 1), to.del(0, 0, 3)],
    [to.del(0, 0, 5)],
  ],
  [
    '[del, del, del] gets compressed correctly 8',
    [to.del(0, 0, 1), to.del(0, 1, 0), to.del(0, 0, 1)],
    [to.del(0, 0, 2)],
  ],
  [
    '[del, del, del] gets compressed correctly 9',
    [to.del(0, 5, 1), to.del(0, 0, 1), to.del(0, 0, 2)],
    [to.del(0, 5, 1), to.del(0, 0, 3)],
  ],
  [
    '[del, del, del] gets compressed correctly 10',
    [to.del(0, 5, 1), to.del(0, 0, 2), to.del(0, 0, 3)],
    [to.del(0, 0, 6)],
  ],
  [
    '[del, del, del] gets compressed correctly 11',
    [to.del(0, 5, 1), to.del(0, 1, 3), to.del(0, 0, 2)],
    [to.del(0, 0, 6)],
  ],
  [
    '[del, del, del] gets compressed correctly 12',
    [to.del(0, 5, 1), to.del(0, 1, 10), to.del(0, 0, 2)],
    [to.del(0, 0, 13)],
  ],
  [
    '[del, del, del] gets compressed correctly 13',
    [to.del(0, 5, 1), to.del(0, 1, 3), to.del(0, 0, 10)],
    [to.del(0, 0, 14)],
  ],
  [
    '[del, del, del] gets compressed correctly 14',
    [to.del(0, 5, 5), to.del(0, 1, 3), to.del(0, 0, 2)],
    [to.del(0, 0, 10)],
  ],
  [
    '[del, del, del] gets compressed correctly 15',
    [to.del(0, 0, 1), to.del(0, 1, 1), to.del(0, 0, 1)],
    [to.del(0, 0, 3)],
  ],
];

testCompressArray(tests);