const { add, del, newline, remline } = require('../lib/subdifOps');
const { createMetaArr, testLETArray } = require('./primTestingLib');

const tests = [
  [
    'Excluding [add] from [add] 1.',
    [add(0, 1, 'a')],
    [add(0, 0, 'b')],
    [add(0, 0, 'a')], // 'b' was inserted before 'a'
  ],
  [
    'Excluding [add] from [add] 2.',
    [add(0, 0, 'a')],
    [add(0, 1, 'b')],
    [add(0, 0, 'a')], // 'b' was inserted after 'a'
  ],
  [
    'Excluding [add] from [add] 3.',
    [add(0, 0, 'a')],
    [add(0, 0, 'b')],
    [add(0, 0, 'a')],
    [createMetaArr(false, true, null, undefined, 0)],
    ///TODO: there might be some lost information going on here, test I/E on this example
  ],
  [
    'Excluding [del] from [add] 1.',
    [add(0, 3, 'a')],
    [del(0, 0, 1)],
    [add(0, 4, 'a')],
  ],
  [
    'Excluding [del] from [add] 2.',
    [add(0, 3, 'a')],
    [del(0, 1, 5)],
    [add(0, 8, 'a')],
  ],
  [
    'Excluding [del] from [add] 3.',
    [add(0, 3, 'a')],
    [del(0, 0, 5)],
    [add(0, 8, 'a')],
  ],
  [
    'Excluding [del] from [add] 4.',
    [add(0, 3, 'a')],
    [del(0, 3, 1)],
    [add(0, 3, 'a')], ///TODO: should this be (0, 3, 'a') or (0, 4, 'a')?
  ],
  [
    'Excluding [del] from [add] 5.',
    [add(0, 3, 'a')],
    [del(0, 4, 1)],
    [add(0, 3, 'a')],
  ],
  [
    'Excluding [add] from [del] 1.',
    [del(0, 3, 3)],
    [add(0, 0, 'a')],
    [del(0, 2, 3)],
  ],
  [
    'Excluding [add] from [del] 2.',
    [del(0, 3, 3)],
    [add(0, 3, 'a')],
    [del(0, 0, 1), del(0, 3, 2)],
    [
      createMetaArr(false, true, undefined, undefined, 0, [ 1 ]),
      createMetaArr(),
    ],
  ],
  [
    'Excluding [add] from [del] 3.',
    [del(0, 3, 3)],
    [add(0, 4, 'a')],
    [del(0, 0, 1), del(0, 3, 2)],
    [
      createMetaArr(false, true, undefined, undefined, 0, [ 1 ]),
      createMetaArr(),
    ],
  ],
  [
    'Excluding [add] from [del] 4.',
    [del(0, 3, 3)],
    [add(0, 6, 'a')],
    [del(0, 3, 3)],
  ],
  [
    'Excluding [add] from [del] 5.',
    [del(0, 3, 3)],
    [add(0, 7, 'a')],
    [del(0, 3, 3)],
  ],
  [
    'Excluding [del] from [del] 1.',
    [del(0, 3, 3)],
    [del(0, 0, 1)],
    [del(0, 4, 3)],
  ],
  [
    'Excluding [del] from [del] 2.',
    [del(0, 3, 3)],
    [del(0, 3, 1)],
    [del(0, 4, 3)],
  ],
  [
    'Excluding [del] from [del] 3.',
    [del(0, 3, 3)],
    [del(0, 4, 1)],
    [del(0, 3, 1), del(0, 5, 2)], ///TODO: check lost info, test I/E
    [
      createMetaArr(false, false, undefined, undefined, undefined, [1]),
      createMetaArr(),
    ]
  ],
  [
    'Excluding [del] from [del] 4.',
    [del(0, 3, 3)],
    [del(0, 5, 1)],
    [del(0, 3, 2), del(0, 6, 1)],
    [
      createMetaArr(false, false, undefined, undefined, undefined, [1]),
      createMetaArr(),
    ]
  ],
  [
    'Excluding [del] from [del] 5.',
    [del(0, 3, 3)],
    [del(0, 6, 1)],
    [del(0, 3, 3)],
  ],
];

testLETArray(tests);
