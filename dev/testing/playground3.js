const { makeDependant, makeIndependant, LIT, LET } = require('../lib/dif');
const { add, del, newline, remline, wrapDif, unwrapDif, wrapSubdif, unwrapSubdif } = require('../lib/subdifOps');
const { createMetaArr, DEBUGTestLITArray, DEBUGTestLETArray, DEBUGTestIndepDepArray } = require('./primTestingLib');

const testsLET = [
  [
    'Excluding [del] from [del] 2.',
    [del(0, 3, 3)],
    [del(0, 3, 1)],
    [del(0, 4, 3)],
  ],
]

const testsLIT = [
    [
    'Including [del] to [add] 2.',
    [add(0, 3, 'a')],
    [del(0, 1, 5)],
    [add(0, 1, 'a')],
  ],
];

const testsIndepDep = [
  [
    '[newline, newline, remline, newline, remline] 8.',
    [
      [ 0, 3, true ],
      [ 0, 3, false ],
      [ 0, 0, true ],
      [ 1, 2, false ]
    ],
  ],
];

//DEBUGTestLITArray(testsLIT);
//DEBUGTestLETArray(testsLET);
DEBUGTestIndepDepArray(testsIndepDep);