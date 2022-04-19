const { add, del, move, newline, remline } = require('../lib/subdifOps');
const { createMetaArr, testLITArray } = require('./primTestingLib');

const tests = [
  [
    'Including [add] to [add] 1.',
    [add(0, 1, 'a')],
    [add(0, 0, 'b')],
    [add(0, 2, 'a')], // 'b' was inserted before 'a'
  ],
  [
    'Including [add] to [add] 2.',
    [add(0, 0, 'a')],
    [add(0, 1, 'b')],
    [add(0, 0, 'a')], // 'b' was inserted after 'a'
  ],
  [
    'Including [add] to [add] 3.',
    [add(0, 0, 'a')],
    [add(0, 0, 'b')],
    [add(0, 1, 'a')], // 'b' was inserted before 'a'
  ],
  [
    'Including [del] to [add] 1.',
    [add(0, 3, 'a')],
    [del(0, 0, 1)],
    [add(0, 2, 'a')],
  ],
  [
    'Including [del] to [add] 2.',
    [add(0, 3, 'a')],
    [del(0, 1, 5)],
    [add(0, 1, 'a')], // losing info
    [createMetaArr(true, false, 0, 0)],
  ],
  [
    'Including [del] to [add] 3.',
    [add(0, 3, 'a')],
    [del(0, 0, 5)],
    [add(0, 0, 'a')], // losing info
    [createMetaArr(true, false, 0, 0)],
  ],
  [
    'Including [del] to [add] 4.',
    [add(0, 3, 'a')],
    [del(0, 3, 1)],
    [add(0, 3, 'a')],
  ],
  [
    'Including [del] to [add] 5.',
    [add(0, 3, 'a')],
    [del(0, 4, 1)],
    [add(0, 3, 'a')],
  ],
  [
    'Including [add] to [del] 1.',
    [del(0, 3, 3)],
    [add(0, 0, 'a')],
    [del(0, 4, 3)],
  ],
  [
    'Including [add] to [del] 2.',
    [del(0, 3, 3)],
    [add(0, 3, 'a')],
    [del(0, 4, 3)],
  ],
  [
    'Including [add] to [del] 3.',
    [del(0, 3, 3)],
    [add(0, 4, 'a')],
    [del(0, 3, 1), del(0, 5, 2)],
    [
      createMetaArr(false, false, undefined, undefined, undefined, [1]),
      createMetaArr(),
    ],
  ],
  [
    'Including [add] to [del] 4.',
    [del(0, 3, 3)],
    [add(0, 6, 'a')],
    [del(0, 3, 3)],
  ],
  [
    'Including [add] to [del] 5.',
    [del(0, 3, 3)],
    [add(0, 7, 'a')],
    [del(0, 3, 3)],
  ],
  [
    'Including [del] to [del] 1.',
    [del(0, 3, 3)],
    [del(0, 0, 1)],
    [del(0, 2, 3)],
  ],
  [
    'Including [del] to [del] 2.',
    [del(0, 3, 3)],
    [del(0, 3, 1)],
    [del(0, 3, 2)], // losing info
    [createMetaArr(true, false, 0, 0)],
  ],
  [
    'Including [del] to [del] 3.',
    [del(0, 3, 3)],
    [del(0, 4, 1)],
    [del(0, 3, 2)], // losing info
    [createMetaArr(true, false, 0, 0)],
  ],
  [
    'Including [del] to [del] 4.',
    [del(0, 3, 3)],
    [del(0, 5, 1)],
    [del(0, 3, 2)], // losing info
    [createMetaArr(true, false, 0, 0)],
  ],
  [
    'Including [del] to [del] 5.',
    [del(0, 3, 3)],
    [del(0, 6, 1)],
    [del(0, 3, 3)],
  ],
  [
    'Including [newline] to [newline] 1.',
    [newline(0, 0)],
    [newline(0, 0)],
    [newline(1, 0)],
  ],
  [
    'Including [newline] to [newline] 2.',
    [newline(0, 1)],
    [newline(0, 0)],
    [newline(1, 1)],
  ],
  [
    'Including [newline] to [newline] 3.',
    [newline(0, 0)],
    [newline(0, 1)],
    [newline(0, 0)],
  ],
  [
    'Including [newline] to [newline] 4.',
    [newline(0, 1)],
    [newline(0, 1)],
    [newline(1, 0)],
  ],
  [
    'Including [newline] to [newline] 5.',
    [newline(1, 0)],
    [newline(0, 0)],
    [newline(2, 0)],
  ],
  [
    'Including [newline] to [newline] 6.',
    [newline(1, 1)],
    [newline(0, 0)],
    [newline(2, 1)],
  ],
  [
    'Including [newline] to [newline] 7.',
    [newline(1, 1)],
    [newline(0, 1)],
    [newline(2, 1)],
  ],
  [
    'Including [newline] to [newline] 8.',
    [newline(0, 0)],
    [newline(1, 0)],
    [newline(0, 0)],
  ],
  [
    'Including [newline] to [remline] 1.',
    [remline(0, 0)],
    [newline(0, 0)],
    [remline(1, 0)],
  ],
  [
    'Including [newline] to [remline] 2.',
    [remline(0, 1)],
    [newline(0, 0)],
    [remline(1, 1)],
  ],
  [
    'Including [newline] to [remline] 3.',
    [remline(0, 1)],
    [newline(0, 1)],
    [remline(1, 0)],
  ],
  [
    'Including [newline] to [remline] 4.',
    [remline(0, 0)],
    [newline(1, 0)],
    [remline(0, 0)],
  ],
  [
    'Including [newline] to [remline] 5.',
    [remline(0, 1)],
    [newline(1, 0)],
    [remline(0, 1)],
  ],
  [
    'Including [newline] to [remline] 6.',
    [remline(0, 1)],
    [newline(1, 1)],
    [remline(0, 1)],
  ],
  [
    'Including [newline] to [remline] 7.',
    [remline(1, 0)],
    [newline(0, 0)],
    [remline(2, 0)],
  ],
  [
    'Including [newline] to [remline] 8.',
    [remline(1, 1)],
    [newline(0, 0)],
    [remline(2, 1)],
  ],
  [
    'Including [remline] to [newline] 1.',
    [newline(0, 0)],
    [remline(0, 0)],
    [newline(0, 0)],
  ],
  [
    'Including [remline] to [newline] 2.',
    [newline(1, 0)],
    [remline(0, 0)],
    [newline(0, 0)],
  ],
  [
    'Including [remline] to [newline] 3.',
    [newline(1, 1)],
    [remline(0, 0)],
    [newline(0, 1)],
  ],
  [
    'Including [remline] to [newline] 4.',
    [newline(1, 1)],
    [remline(0, 1)],
    [newline(0, 2)],
  ],
  [
    'Including [remline] to [newline] 5.',
    [newline(2, 1)],
    [remline(0, 1)],
    [newline(1, 1)],
  ],
  [
    'Including [remline] to [newline] 6.',
    [newline(0, 2)],
    [remline(0, 2)],
    [newline(0, 2)],
  ],
  [
    'Including [remline] to [newline] 7.',
    [newline(0, 1)],
    [remline(0, 2)],
    [newline(0, 1)],
  ],
  [
    'Including [remline] to [remline] 1.',
    [remline(0, 0)],
    [remline(0, 0)],
    [remline(0, 0)],
    [createMetaArr(true, false, 0)],
  ],
  [
    'Including [remline] to [remline] 2.',
    [remline(1, 1)],
    [remline(1, 1)],
    [remline(1, 1)],
    [createMetaArr(true, false, 0)],
  ],
  [
    'Including [remline] to [remline] 3.',
    [remline(1, 0)],
    [remline(0, 0)],
    [remline(0, 0)],
  ],
  [
    'Including [remline] to [remline] 4.',
    [remline(1, 1)],
    [remline(0, 0)],
    [remline(0, 1)],
  ],
  [
    'Including [remline] to [remline] 5.',
    [remline(0, 0)],
    [remline(1, 0)],
    [remline(0, 0)],
  ],
  [
    'Including [remline] to [remline] 6.',
    [remline(0, 1)],
    [remline(1, 0)],
    [remline(0, 1)],
  ],
  [
    'Including [remline] to [remline] 7.',
    [remline(0, 1)],
    [remline(1, 1)],
    [remline(0, 1)],
  ],
  [
    'Including [remline] to [remline] 8.',
    [remline(1, 0)],
    [remline(0, 1)],
    [remline(0, 1)],
  ],
  [
    'Including [remline] to [remline] 9.',
    [remline(1, 1)],
    [remline(0, 1)],
    [remline(0, 2)],
  ],
  [
    'Including [remline] to [remline] 10.',
    [remline(2, 1)],
    [remline(0, 1)],
    [remline(1, 1)],
  ],
  [
    'Including [newline] to [add] 1.',
    [add(0, 0, 'a')],
    [newline(0, 0)],
    [add(1, 0, 'a')],
  ],
  [
    'Including [newline] to [add] 2.',
    [add(0, 0, 'a')],
    [newline(0, 1)],
    [add(0, 0, 'a')],
  ],
  [
    'Including [newline] to [add] 3.',
    [add(0, 0, 'a')],
    [newline(1, 0)],
    [add(0, 0, 'a')],
  ],
  [
    'Including [newline] to [add] 4.',
    [add(0, 0, 'a')],
    [newline(1, 1)],
    [add(0, 0, 'a')],
  ],
  [
    'Including [newline] to [add] 5.',
    [add(0, 1, 'a')],
    [newline(0, 0)],
    [add(1, 1, 'a')],
  ],
  [
    'Including [newline] to [add] 6.',
    [add(0, 1, 'a')],
    [newline(0, 1)],
    [add(1, 0, 'a')],
  ],
  [
    'Including [newline] to [add] 7.',
    [add(0, 2, 'a')],
    [newline(0, 1)],
    [add(1, 1, 'a')],
  ],
  [
    'Including [newline] to [add] 8.',
    [add(1, 2, 'a')],
    [newline(0, 1)],
    [add(2, 2, 'a')],
  ],
];

testLITArray(tests);
