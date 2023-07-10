const { add, del } = require('../controller/lib/subdifOps');
const { compress } = require('../controller/lib/compress');

function testCompress(testName, inputDif, expected) {
  test(testName, () => {
    const result = compress(inputDif);
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
    [add(1, 2, 0), del(1, 2, 0), add(0, 0, 'a')],
    [add(0, 0, 'a')],
  ],
  [
    'Dif containing only empty subdifs returns an empty dif',
    [add(1, 2, 0), del(1, 2, 0)],
    [],
  ],
  [
    '[add, add] gets compressed correctly 1',
    [add(0, 0, 'a'), add(0, 1, 'bc')],
    [del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 2',
    [add(0, 0, 'ac'), add(0, 1, 'b')],
    [del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 3',
    [add(0, 0, 'c'), add(0, 0, 'ab')],
    [del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 4',
    [add(0, 1, 'c'), add(0, 0, 'ab')],
    [del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 5',
    [add(0, 2, 'c'), add(0, 0, 'ab')],
    [del(0, 0, 'abc')],
  ],
  [
    '[add, add] gets compressed correctly 6',
    [add(0, 3, 'c'), add(0, 0, 'ab')],
    [add(0, 3, 'c'), add(0, 0, 'ab')],
  ],
  [
    '[add, add] gets compressed correctly 7',
    [add(0, 0, 'a'), add(1, 1, 'bc')],
    [add(0, 0, 'a'), add(1, 1, 'bc')],
  ],
  [
    '[add, add, add] gets compressed correctly 1',
    [add(0, 0, 'a'), add(0, 1, 'b'), add(0, 2, 'c')],
    [add(0, 0, 'abc')],
  ],
  [
    '[add, add, add] gets compressed correctly 2',
    [add(0, 0, 'c'), add(0, 0, 'b'), add(0, 0, 'a')],
    [add(0, 0, 'abc')],
  ],
  [
    '[add, add, add] gets compressed correctly 3',
    [add(0, 0, 'adg'), add(0, 1, 'bc'), add(0, 4, 'ef')],
    [add(0, 0, 'abcdefg')],
  ],
  [
    '[add, add, add] gets compressed correctly 4',
    [add(0, 0, 'afg'), add(0, 1, 'be'), add(0, 2, 'cd')],
    [add(0, 0, 'abcdefg')],
  ],
  [
    '[add, add, add] gets compressed correctly 5',
    [add(0, 0, 'abc'), add(0, 3, 'fg'), add(0, 3, 'de')],
    [add(0, 0, 'abcdefg')],
  ],
  [
    '[add, add, add] gets compressed correctly 6',
    [add(0, 0, 'abe'), add(0, 3, 'fg'), add(0, 2, 'cd')],
    [add(0, 0, 'abcdefg')],
  ],
  [
    '[del, del] gets compressed correctly 1',
    [del(0, 0, 1), del(0, 1, 2)],
    // the second del is dependent on the first, it would have to be independant in order to be
    // compressed to del(0, 0, 3)
    [del(0, 0, 1), del(0, 1, 2)],
  ],
  [
    '[del, del] gets compressed correctly 2',
    [del(0, 0, 1), del(0, 0, 2)],
    [del(0, 0, 3)],
  ],
  [
    '[del, del] gets compressed correctly 3',
    [del(0, 1, 1), del(0, 1, 2)],
    [del(0, 1, 3)],
  ],
  [
    '[del, del] gets compressed correctly 4',
    [del(0, 2, 1), del(0, 1, 2)],
    [del(0, 1, 3)],
  ],
  [
    '[del, del] gets compressed correctly 5',
    [del(0, 2, 2), del(0, 1, 2)],
    [del(0, 1, 4)],
  ],
  [
    '[del, del] gets compressed correctly 6',
    [del(0, 2, 1), del(0, 3, 2)],
    [del(0, 2, 1), del(0, 3, 2)],
  ],
  [
    '[del, del] gets compressed correctly 7',
    [del(0, 2, 1), del(0, 4, 2)],
    [del(0, 2, 1), del(0, 4, 2)],
  ],
  [
    '[del, del] gets compressed correctly 8',
    [del(0, 4, 2), del(0, 2, 1)],
    [del(0, 4, 2), del(0, 2, 1)],
  ],
  [
    '[del, del] gets compressed correctly 9',
    [del(0, 4, 2), del(0, 2, 2)],
    [del(0, 2, 4)],
  ],
  [
    '[del, del] gets compressed correctly 10',
    [del(0, 0, 10), del(0, 1, 5)],
    [del(0, 0, 10), del(0, 1, 5)],
  ],
  [
    '[del, del] gets compressed correctly 11',
    [del(0, 0, 10), del(0, 5, 10)],
    [del(0, 0, 10), del(0, 5, 10)],
  ],
  [
    '[del, del] gets compressed correctly 12',
    [del(0, 1, 5), del(0, 0, 10)],
    [del(0, 0, 15)],
  ],
  [
    '[del, del] gets compressed correctly 13',
    [del(0, 5, 10), del(0, 0, 10)],
    [del(0, 0, 20)],
  ],
  [
    '[del, del] gets compressed correctly 14',
    [del(0, 5, 5), del(0, 0, 10)],
    [del(0, 0, 15)],
  ],
  [
    '[del, del, del] gets compressed correctly 1',
    [del(0, 0, 1), del(0, 1, 1), del(0, 2, 1)],
    [del(0, 0, 1), del(0, 1, 1), del(0, 2, 1)],
  ],
  [
    '[del, del, del] gets compressed correctly 2',
    [del(0, 0, 1), del(0, 0, 1), del(0, 0, 1)],
    [del(0, 0, 3)],
  ],
  [
    '[del, del, del] gets compressed correctly 3',
    [del(0, 0, 1), del(1, 0, 1), del(2, 0, 1)],
    [del(0, 0, 1), del(1, 0, 1), del(2, 0, 1)],
  ],
  [
    '[del, del, del] gets compressed correctly 4',
    [del(0, 0, 3), del(0, 1, 2), del(0, 0, 1)],
    [del(0, 0, 6)],
  ],
  [
    '[del, del, del] gets compressed correctly 5',
    [del(0, 2, 1), del(0, 1, 1), del(0, 0, 1)],
    [del(0, 0, 3)],
  ],
  [
    '[del, del, del] gets compressed correctly 6',
    [del(0, 0, 10), del(0, 3, 7), del(0, 5, 5)],
    [del(0, 0, 10), del(0, 3, 7), del(0, 5, 5)],
  ],
  [
    '[del, del, del] gets compressed correctly 7',
    [del(0, 0, 1), del(0, 2, 1), del(0, 0, 3)],
    [del(0, 0, 5)],
  ],
  [
    '[del, del, del] gets compressed correctly 8',
    [del(0, 0, 1), del(0, 1, 0), del(0, 0, 1)],
    [del(0, 0, 2)],
  ],
  [
    '[del, del, del] gets compressed correctly 9',
    [del(0, 5, 1), del(0, 0, 1), del(0, 0, 2)],
    [del(0, 5, 1), del(0, 0, 3)],
  ],
  [
    '[del, del, del] gets compressed correctly 10',
    [del(0, 5, 1), del(0, 0, 2), del(0, 0, 3)],
    [del(0, 0, 6)],
  ],
  [
    '[del, del, del] gets compressed correctly 11',
    [del(0, 5, 1), del(0, 1, 3), del(0, 0, 2)],
    [del(0, 0, 6)],
  ],
  [
    '[del, del, del] gets compressed correctly 12',
    [del(0, 5, 1), del(0, 1, 10), del(0, 0, 2)],
    [del(0, 0, 13)],
  ],
  [
    '[del, del, del] gets compressed correctly 13',
    [del(0, 5, 1), del(0, 1, 3), del(0, 0, 10)],
    [del(0, 0, 14)],
  ],
  [
    '[del, del, del] gets compressed correctly 14',
    [del(0, 5, 5), del(0, 1, 3), del(0, 0, 2)],
    [del(0, 0, 10)],
  ],
  [
    '[del, del, del] gets compressed correctly 15',
    [del(0, 0, 1), del(0, 1, 1), del(0, 0, 1)],
    [del(0, 0, 3)],
  ],
];

testCompressArray(tests);