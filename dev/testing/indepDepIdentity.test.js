const { add, del, newline, remline } = require('../lib/subdifOps');
const { testIndepDepArray } = require('./primTestingLib');

const tests = [
  [
    '[add, add, add] 1.',
    [add(0, 0, 'a'), add(0, 1, 'bc'), add(0, 3, 'defg')],
  ],
  [
    '[add, add, add] 2.',
    [add(0, 0, 'a'), add(0, 0, 'bc'), add(0, 0, 'defg')],
  ],
  [
    '[add, add, add] 3.',
    [add(0, 0, 'a'), add(0, 0, 'bc'), add(0, 1, 'defg')],
  ],
  [
    '[add, del, add, del] 1.',
    [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 2, 'ef'), del(0, 1, 2)],
  ],
  [
    '[add, del, add, del] 2.',
    [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 1, 'bc'), del(0, 0, 4)],
  ],
  [
    '[add, del, add, del] 3.',
    [add(0, 0, 'abcd'), del(0, 0, 4), add(0, 0, 'abcd'), del(0, 0, 4)],
  ],
  [
    '[add, del, add, del] 4.',
    [add(0, 0, 'abcd'), del(0, 1, 2), add(0, 0, 'abcd'), del(0, 1, 4)],
  ],
  [
    '[newline, add] 1.',
    [newline(0, 0), add(0, 0, 'a')],
  ],
  [
    '[newline, add] 2.',
    [newline(1, 1), add(2, 1, 'a')],
  ],
  [
    '[newline, add] 3.',
    [newline(1, 0), add(0, 0, 'a')],
  ],
  [
    '[add, newline] 1.',
    [add(0, 0, 'a'), newline(0, 0)],
  ],
  [
    '[add, newline] 2.',
    [add(0, 0, 'ab'), newline(0, 0)],
  ],
  [
    '[add, newline] 3.',
    [add(0, 0, 'ab'), newline(0, 1)],
  ],
  [
    '[add, newline] 4.',
    [add(0, 0, 'ab'), newline(0, 2)],
  ],
  [
    '[add, newline] 5.',
    [add(0, 0, 'ab'), newline(0, 3)],
  ],
  [
    '[add, newline] 6.',
    [add(1, 0, 'a'), newline(0, 0)],
  ],
  [
    '[newline, del] 1.',
    [newline(0, 0), del(1, 1, 1)],
  ],
  [
    '[newline, del] 2.',
    [newline(2, 0), del(1, 1, 1)],
  ],
  [
    '[newline, del] 3.',
    [newline(0, 2), del(0, 0, 1)],
  ],
  [
    '[newline, del] 4.',
    [newline(0, 2), del(0, 0, 2)],
  ],
  [
    '[newline, del] 5.',
    [newline(0, 2), del(0, 1, 1)],
  ],
  [
    '[del, newline] 1.',
    [del(0, 0, 1), newline(0, 0)],
  ],
  [
    '[del, newline] 2.',
    [del(0, 1, 1), newline(0, 0)],
  ],
  [
    '[del, newline] 3.',
    [del(0, 0, 2), newline(0, 0)],
  ],
  [
    '[del, newline] 4.',
    [del(0, 0, 1), newline(0, 1)],
  ],
  [
    '[del, newline] 5.',
    [del(0, 0, 2), newline(0, 1)],
  ],
  [
    '[del, newline] 6.',
    [del(0, 0, 2), newline(0, 5)],
  ],
  [
    '[del, newline] 7.',
    [del(0, 0, 2), newline(1, 0)],
  ],
  [
    '[del, newline] 8.',
    [del(0, 0, 2), newline(1, 1)],
  ],
  [
    '[remline, add] 1.',
    [remline(0, 0), add(0, 0, 'a')],
  ],
  [
    '[remline, add] 2.',
    [remline(0, 0), add(0, 0, 'ab')],
  ],
  [
    '[remline, add] 3.',
    [remline(0, 1), add(0, 0, 'a')],
  ],
  [
    '[remline, add] 4.',
    [remline(0, 1), add(0, 1, 'a')],
  ],
  [
    '[remline, add] 5.',
    [remline(0, 1), add(0, 0, 'ab')],
  ],
  [
    '[remline, add] 6.',
    [remline(0, 1), add(0, 1, 'ab')],
  ],
  [
    '[remline, add] 7.',
    [remline(0, 0), add(1, 0, 'a')],
  ],
  [
    '[remline, add] 8.',
    [remline(0, 0), add(1, 1, 'a')],
  ],
  [
    '[remline, add] 9.',
    [remline(1, 0), add(0, 0, 'a')],
  ],
  [
    '[remline, add] 10.',
    [remline(1, 0), add(0, 1, 'a')],
  ],
  [
    '[remline, add] 11.',
    [remline(0, 2), add(1, 0, 'a')],
  ],
  [
    '[remline, add] 12.',
    [remline(0, 2), add(1, 1, 'a')],
  ],
  [
    '[remline, add] 13.',
    [remline(0, 2), add(1, 0, 'ab')],
  ],
  [
    '[remline, add] 14.',
    [remline(0, 0), add(2, 0, 'a')],
  ],
  [
    '[remline, add] 15.',
    [remline(0, 0), add(2, 1, 'a')],
  ],
  [
    '[add, remline] 1.',
    [add(0, 0, 'a'), remline(0, 1)],
  ],
  [
    '[add, remline] 2.',
    [add(0, 0, 'ab'), remline(0, 2)],
  ],
  [
    '[add, remline] 3.',
    [add(0, 1, 'a'), remline(0, 2)],
  ],
  [
    '[add, remline] 4.',
    [add(0, 1, 'ab'), remline(0, 3)],
  ],
  [
    '[add, remline] 5.',
    [add(0, 0, 'a'), remline(0, 2)],
  ],
  [
    '[add, remline] 6.',
    [add(0, 0, 'ab'), remline(0, 5)],
  ],
  [
    '[add, remline] 7.',
    [add(0, 1, 'a'), remline(0, 5)],
  ],
  [
    '[add, remline] 8.',
    [add(0, 0, 'a'), remline(1, 0)],
  ],
  [
    '[add, remline] 9.',
    [add(0, 0, 'a'), remline(1, 1)],
  ],
  [
    '[add, remline] 10.',
    [add(1, 0, 'a'), remline(0, 0)],
  ],
  [
    '[add, remline] 11.',
    [add(1, 0, 'a'), remline(0, 1)],
  ],
  [
    '[remline, del] 1.',
    [remline(0, 1), del(0, 0, 1)],
  ],
  [
    '[remline, del] 2.',
    [remline(0, 2), del(0, 0, 2)],
  ],
  [
    '[remline, del] 3.',
    [remline(0, 2), del(0, 0, 1)],
  ],
  [
    '[remline, del] 4.',
    [remline(1, 0), del(0, 0, 1)],
  ],
  [
    '[remline, del] 5.',
    [remline(1, 1), del(0, 0, 1)],
  ],
  [
    '[remline, del] 6.',
    [remline(0, 0), del(1, 0, 1)],
  ],
  [
    '[remline, del] 7.',
    [remline(0, 1), del(1, 0, 1)],
  ],
  [
    '[remline, del] 8.',
    [remline(0, 1), del(1, 1, 1)],
  ],
  [
    '[del, remline] 1.',
    [del(0, 0, 1), remline(0, 0)],
  ],
  [
    '[del, remline] 2.',
    [del(0, 0, 1), remline(0, 1)],
  ],
  [
    '[del, remline] 3.',
    [del(0, 0, 2), remline(0, 0)],
  ],
  [
    '[del, remline] 4.',
    [del(0, 0, 2), remline(0, 1)],
  ],
  [
    '[del, remline] 5.',
    [del(0, 0, 1), remline(0, 2)],
  ],
  [
    '[del, remline] 6.',
    [del(0, 1, 1), remline(0, 4)],
  ],
  [
    '[del, remline] 7.',
    [del(0, 0, 1), remline(1, 0)],
  ],
  [
    '[del, remline] 8.',
    [del(0, 0, 1), remline(1, 1)],
  ],
  [
    '[del, remline] 9.',
    [del(1, 0, 1), remline(0, 0)],
  ],
  [
    '[del, remline] 10.',
    [del(1, 0, 1), remline(0, 1)],
  ],
  [
    '[del, remline] 11.',
    [del(1, 1, 1), remline(0, 0)],
  ],
  [
    '[del, remline] 12.',
    [del(1, 1, 1), remline(0, 1)],
  ],
  [
    '[newline, newline, newline] 1.',
    [newline(0, 0), newline(0, 0), newline(0, 0)],
  ],
  [
    '[newline, newline, newline] 2.',
    [newline(0, 0), newline(1, 0), newline(2, 0)],
  ],
  [
    '[newline, newline, newline] 3.',
    [newline(2, 0), newline(1, 0), newline(0, 0)],
  ],
  [
    '[newline, newline, newline] 4.',
    [newline(1, 0), newline(1, 0), newline(0, 0)],
  ],
  [
    '[newline, newline, newline] 5.',
    [newline(2, 0), newline(1, 0), newline(2, 0)], 
  ],
  [
    '[newline, newline, newline] 6.',
    [newline(1, 0), newline(2, 0), newline(1, 0)],
  ],
  [
    '[newline, newline, newline] 7.',
    [newline(2, 0), newline(2, 0), newline(0, 0)],
  ],
  [
    '[add, newline, add, newline] 1.',
    [add(0, 0, '1212'), newline(0, 2), add(1, 2, '34'), newline(1, 2)],
  ],
  [
    '[add, newline, add, newline] 2.',
    [add(0, 0, '1212'), newline(0, 2), add(0, 1, 'ab'), newline(0, 2)],
  ],
  [
    '[add, newline, add, newline] 3.',
    [add(0, 0, '1234'), newline(0, 4), add(1, 0, '1234'), newline(1, 4)],
  ],
  [
    '[add, newline, add, newline] 4.',
    [add(0, 0, '1212'), newline(0, 2), add(1, 1, 'ab'), newline(1, 2)],
  ],
  [
    '[add, newline, add, newline] 5.',
    [add(0, 0, '1234'), newline(0, 4), add(0, 4, '5678'), newline(0, 8)],
  ],
  [
    '[add, newline, add, newline] 6.',
    [add(0, 0, '1231'), newline(0, 3), add(0, 4, '4561'), newline(0, 6)],
  ],
  [
    '[newline, newline, remline, newline, remline] 1.',
    [newline(0, 0), newline(0, 0), remline(0, 0), newline(0, 0), remline(0, 0)],
  ],
  [
    '[newline, newline, remline, newline, remline] 2.',
    [newline(1, 0), newline(0, 0), remline(0, 0), newline(0, 0), remline(0, 0)],
  ],
  [
    '[newline, newline, remline, newline, remline] 3.',
    [newline(0, 0), newline(1, 0), remline(2, 0), newline(1, 0), remline(1, 0)],
  ],
  [
    '[newline, newline, remline, newline, remline] 4.',
    [newline(0, 0), newline(0, 0), remline(0, 0), newline(3, 0), remline(3, 0)],
  ],
  [
    '[newline, newline, remline, newline, remline] 5.',
    [newline(7, 0), newline(7, 0), remline(2, 0), newline(1, 0), remline(3, 0)],
  ],
  [
    '[newline, newline, remline, newline, remline] 6.',
    [newline(1, 0), newline(3, 0), remline(5, 0), newline(2, 0), remline(4, 0)],
  ],
  [
    '[newline, newline, remline, newline, remline] 7.',
    [newline(5, 0), newline(4, 0), remline(3, 0), newline(2, 0), remline(1, 0)],
  ],
  [
    '[newline, newline, remline, newline, remline] 8.',
    [newline(0, 2), newline(0, 2), remline(1, 0), newline(1, 4), remline(0, 2)],
  ],
  [
    '[newline, newline, remline, newline, remline] 9.',
    [newline(0, 2), newline(1, 2), remline(1, 2), newline(1, 2), remline(1, 2)],
  ],
  [
    '[newline, newline, remline, newline, remline] 10.',
    [newline(0, 1), newline(0, 1), remline(0, 1), newline(0, 1), remline(0, 1)],
  ],
  [
    '[add, newline, newline, newline, del, remline] 1.',
    [add(0, 0, '12345678'), newline(0, 2), newline(1, 2), newline(2, 2), del(1, 0, 2), remline(0, 2)],
  ],
  [
    '[add, newline, newline, newline, del, remline] 2.',
    [add(0, 0, '12345678'), newline(0, 6), newline(0, 4), newline(0, 2), del(3, 0, 2), remline(2, 2)],
  ],
  [
    '[add, newline, newline, newline, del, remline] 3.',
    [add(0, 1, '23456789'), newline(0, 2), newline(0, 2), newline(0, 2), del(0, 0, 2), remline(0, 0)],
  ],
  [
    '[add, newline, newline, newline, del, remline] 4.',
    [add(1, 1, '23456789'), newline(0, 2), newline(0, 2), newline(3, 2), del(3, 0, 2), remline(2, 0)],
  ],
];

testIndepDepArray(tests);
