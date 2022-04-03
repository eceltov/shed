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
];

testLITArray(tests);
