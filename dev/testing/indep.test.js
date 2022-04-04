const { add, del, move, newline, remline } = require('../lib/subdifOps');
const { testIndepArray } = require('./primTestingLib');

const tests = [
  [
    '1',
    [add(0, 0, 'a'), add(0, 1, 'b'), add(0, 2, 'c')],
    [add(0, 0, 'a'), add(0, 0, 'b'), add(0, 0, 'c')],
  ],
];

testIndepArray(tests);
