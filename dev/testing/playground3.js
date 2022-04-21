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
    'Making a dif [add, newline] independant and then dependant is an identity 1.',
    [add(0, 0, 'a'), newline(0, 0)],
  ],
];

//DEBUGTestLITArray(testsLIT);
//DEBUGTestLETArray(testsLET);
DEBUGTestIndepDepArray(testsIndepDep);